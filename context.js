import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { TokenStorage } from './api/tokenStorage';
import { authService } from './api/authService';
import {
	ensureValidToken,
	setOnTokenRefreshed,
	setOnAuthLost,
	resetAuthLostFlag,
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
	refreshOrganizationData: noopAsync,
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
				const tokenValid = await ensureValidToken();
				if (cancelled) return;
				if (!tokenValid) {
					await TokenStorage.removeToken();
					if (!cancelled) setSessionLoading(false);
					return;
				}
				let userFromSession = await authService.getCurrentSession();
				if (!userFromSession && token) {
					userFromSession = await authService.verifyToken();
				}
				if (!cancelled && userFromSession) {
					let userToSet = userFromSession;
					if (!userFromSession.email) {
						const storedEmail = await TokenStorage.getSessionEmail();
						if (storedEmail) {
							userToSet = { ...userFromSession, email: storedEmail };
						}
					}
					setUser(userToSet);
					setAuth(true);
				} else if (!userFromSession) {
					await TokenStorage.removeToken();
				}
			} catch (e) {
				const isAuthFailure = e?.response?.status === 401;
				if (isAuthFailure && !cancelled) {
					await TokenStorage.removeToken();
				}
			} finally {
				if (!cancelled) setSessionLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Keep token fresh while user is logged in so opening Drawer after idle doesn't 401 and force logout.
	// Refresh every 7 min (before backend expiry); apiClient also refreshes proactively per request when stale.
	const REFRESH_INTERVAL_MS = 7 * 60 * 1000;
	useEffect(() => {
		if (!auth) return;
		const id = setInterval(() => {
			ensureValidToken().catch(() => {});
		}, REFRESH_INTERVAL_MS);
		return () => clearInterval(id);
	}, [auth]);

	// When app comes to foreground (e.g. after update or long background), refresh token so media and other requests succeed.
	useEffect(() => {
		if (!auth) return;
		const sub = AppState.addEventListener('change', (nextAppState) => {
			if (nextAppState !== 'active') return;
			ensureValidToken().catch(() => {});
		});
		return () => sub?.remove();
	}, [auth]);

	const setUserAndToken = async (userData, token) => {
		if (token) {
			await TokenStorage.setTokenWithTimestamp(token);
			resetAuthLostFlag();
		}
		if (userData?.email) await TokenStorage.setSessionEmail(userData.email);
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
				if (userFromSession) {
					let userToSet = userFromSession;
					if (!userFromSession.email) {
						const storedEmail = await TokenStorage.getSessionEmail();
						if (storedEmail) userToSet = { ...userFromSession, email: storedEmail };
					}
					setUserRef.current(userToSet);
				}
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

	/** Refetch organization data (announcements, events, family, ministries, teams). Used e.g. by Homescreen pull-to-refresh. */
	const refreshOrganizationData = useCallback(async () => {
		const orgId = organization?.id;
		if (!orgId) return;
		try {
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
			setAnnouncements(announcementsData ?? {});
			setEvents(eventsData ?? {});
			setFamilyMembers(
				familyMembersData || {
					activeConnections: [],
					pendingConnections: [],
				},
			);
			setMinistries(ministriesData ?? []);
			setTeams(filteredTeams);
			if (ministriesData?.length > 0) {
				setSelectedMinistry(ministriesData[0]);
			}
			setLastDataRefresh(Date.now());
		} catch (_) {}
	}, [organization?.id]);

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
		refreshOrganizationData,
	};

	return (
		<UserContext.Provider value={data}>
			{props.children}
		</UserContext.Provider>
	);
}
