import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TokenStorage } from './api/tokenStorage';
import { authService } from './api/authService';
import {
	ensureValidToken,
	setOnTokenRefreshed,
	setOnAuthLost,
} from './api/apiClient';
import { announcementsApi, eventsApi } from './api/announcementRoutes';
import { familyMembersApi } from './api/familyMemberRoutes';
import { ministryApi } from './api/ministryRoutes';
import { teamsApi } from './api/userRoutes';
import {
	registerForPushNotificationsAsync,
	unregisterPushTokenFromBackend,
} from './src/utils/notificationUtils';

/** Max time to consider a stored session valid. After this, user must sign in again (defense in depth; backend refresh expiry is the real authority). */
const SESSION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const noop = () => {};
const noopAsync = async () => {};

/** Default value so useData() is never undefined (e.g. if consumed before provider or duplicate module). */
const defaultContextValue = {
	auth: false,
	setAuth: noop,
	sessionLoading: true,
	user: {},
	setUser: noop,
	organization: {},
	setOrganization: noop,
	announcements: {},
	setAnnouncements: noop,
	events: {},
	setEvents: noop,
	ministries: [],
	setMinistries: noop,
	familyMembers: [],
	setFamilyMembers: noop,
	selectedMinistry: null,
	setSelectedMinistry: noop,
	teams: [],
	setTeams: noop,
	setUserAndToken: noopAsync,
	clearUserAndToken: noopAsync,
	pendingOrg: { id: null, orgPin: null },
	setPendingOrg: noop,
	lastDataRefresh: 0,
	setLastDataRefresh: noop,
};

export const UserContext = createContext(defaultContextValue);

export function useData() {
	const value = useContext(UserContext);
	return value ?? defaultContextValue;
}

export function UserProvider(props) {
	const [auth, setAuth] = useState(false);
	const [sessionLoading, setSessionLoading] = useState(true);
	const [user, setUser] = useState({});
	const [organization, setOrganization] = useState({});
	const [pendingOrg, setPendingOrg] = useState({ id: null, orgPin: null });
	const [announcements, setAnnouncements] = useState({});
	const [events, setEvents] = useState({});
	const [ministries, setMinistries] = useState([]);
	const [selectedMinistry, setSelectedMinistry] = useState(null);
	const [familyMembers, setFamilyMembers] = useState([]);
	const [teams, setTeams] = useState([]);
	/** Timestamp when app data (announcements, events, etc.) was last refreshed; screens can refetch media when this changes. */
	const [lastDataRefresh, setLastDataRefresh] = useState(0);

	// Restore session on app load — keep user signed in until they sign out
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const token = await TokenStorage.getToken();
				if (!token) {
					if (!cancelled) setSessionLoading(false);
					return;
				}
				const tokenSetAt = await TokenStorage.getTokenSetAt();
				if (
					tokenSetAt != null &&
					Date.now() - tokenSetAt > SESSION_MAX_AGE_MS
				) {
					await TokenStorage.removeToken();
					if (!cancelled) setSessionLoading(false);
					return;
				}
				// Refresh token if expired (e.g. after 10 min) so getCurrentSession succeeds
				try {
					await ensureValidToken();
				} catch (e) {
					if (!cancelled) await TokenStorage.removeToken();
					if (!cancelled) setSessionLoading(false);
					return;
				}
				if (cancelled) return;
				const userFromSession = await authService.getCurrentSession();
				if (!cancelled && userFromSession) {
					setUser(userFromSession);
					setAuth(true);
				} else if (!userFromSession) {
					await TokenStorage.removeToken();
				}
			} catch (e) {
				if (!cancelled) await TokenStorage.removeToken();
			} finally {
				if (!cancelled) setSessionLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const setUserAndToken = async (userData, token) => {
		console.log('Setting user and token:', token);
		if (token) {
			await TokenStorage.setTokenWithTimestamp(token);
		}
		setUser(userData);
		setAuth(true);
	};

	const clearUserAndToken = async () => {
		// Unregister push token so backend stops sending to this device
		try {
			const token = await registerForPushNotificationsAsync();
			if (token) {
				await unregisterPushTokenFromBackend(token);
			}
		} catch (_) {
			// Ignore; still clear auth below
		}
		await TokenStorage.removeToken();
		setUser({});
		if (organization) {
			setOrganization({});
		}
		setAuth(false);
	};

	// When token is refreshed (e.g. after 10 min), refetch session and org data (announcements, events, media trigger, etc.)
	const setUserRef = useRef(setUser);
	setUserRef.current = setUser;
	const clearUserAndTokenRef = useRef(clearUserAndToken);
	clearUserAndTokenRef.current = clearUserAndToken;
	const organizationRef = useRef(organization);
	organizationRef.current = organization;
	const setAnnouncementsRef = useRef(setAnnouncements);
	setAnnouncementsRef.current = setAnnouncements;
	const setEventsRef = useRef(setEvents);
	setEventsRef.current = setEvents;
	const setFamilyMembersRef = useRef(setFamilyMembers);
	setFamilyMembersRef.current = setFamilyMembers;
	const setMinistriesRef = useRef(setMinistries);
	setMinistriesRef.current = setMinistries;
	const setTeamsRef = useRef(setTeams);
	setTeamsRef.current = setTeams;
	const setSelectedMinistryRef = useRef(setSelectedMinistry);
	setSelectedMinistryRef.current = setSelectedMinistry;
	const setLastDataRefreshRef = useRef(setLastDataRefresh);
	setLastDataRefreshRef.current = setLastDataRefresh;
	useEffect(() => {
		setOnTokenRefreshed(async () => {
			try {
				const userFromSession = await authService.getCurrentSession();
				if (userFromSession) setUserRef.current(userFromSession);
				const orgId = organizationRef.current?.id;
				if (orgId) {
					const [
						announcementsData,
						eventsData,
						familyMembersData,
						ministriesData,
						teamsData,
					] = await Promise.all([
						announcementsApi.getAll(orgId),
						eventsApi.getAll(orgId),
						familyMembersApi.getAll(),
						ministryApi.getAllForOrganization(orgId),
						teamsApi.getMyTeams(),
					]);
					const filteredTeams =
						(teamsData?.teams || []).filter(
							(team) => team.organizationId === orgId,
						) || [];
					setAnnouncementsRef.current(announcementsData ?? {});
					setEventsRef.current(eventsData ?? {});
					setFamilyMembersRef.current(
						familyMembersData || {
							activeConnections: [],
							pendingConnections: [],
						},
					);
					setMinistriesRef.current(ministriesData ?? []);
					setTeamsRef.current(filteredTeams);
					if (ministriesData?.length > 0) {
						setSelectedMinistryRef.current(ministriesData[0]);
					}
					setLastDataRefreshRef.current(Date.now());
				}
			} catch (_) {}
		});
		setOnAuthLost(() => {
			clearUserAndTokenRef.current();
		});
		return () => {
			setOnTokenRefreshed(null);
			setOnAuthLost(null);
		};
	}, []);

	const data = {
		auth,
		setAuth,
		sessionLoading,
		user,
		setUser,
		organization,
		setOrganization,
		announcements,
		setAnnouncements,
		events,
		setEvents,
		ministries,
		setMinistries,
		familyMembers,
		setFamilyMembers,
		selectedMinistry,
		setSelectedMinistry,
		teams,
		setTeams,
		setUserAndToken,
		clearUserAndToken,
		pendingOrg,
		setPendingOrg,
		lastDataRefresh,
		setLastDataRefresh,
	};

	console.log('Auth state:', auth);

	return (
		<UserContext.Provider value={data}>
			{props.children}
		</UserContext.Provider>
	);
}
