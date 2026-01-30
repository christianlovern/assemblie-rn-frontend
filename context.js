import { createContext, useContext, useState } from 'react';
import { TokenStorage } from './api/tokenStorage';
export const UserContext = createContext();

export function useData() {
	return useContext(UserContext);
}

export function UserProvider(props) {
	const [auth, setAuth] = useState(false);
	const [user, setUser] = useState({});
	const [organization, setOrganization] = useState({});
	const [pendingOrg, setPendingOrg] = useState({id: null, orgPin: null});
	const [announcements, setAnnouncements] = useState({});
	const [events, setEvents] = useState({});
	const [ministries, setMinistries] = useState([]);
	const [selectedMinistry, setSelectedMinistry] = useState(null);
	const [familyMembers, setFamilyMembers] = useState([]);
	const [teams, setTeams] = useState([]);

	const setUserAndToken = async (userData, token) => {
		console.log('Setting user and token:', token);
		if (token) {
			await TokenStorage.setToken(token);
		}
		setUser(userData);
		setAuth(true);
	};

	const clearUserAndToken = async () => {
		await TokenStorage.removeToken();
		setUser({});
		if (organization) {
			setOrganization({});
		}
		setAuth(false);
	};

	const data = {
		auth,
		setAuth,
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
	};

	console.log('Auth state:', auth);

	return (
		<UserContext.Provider value={data}>
			{props.children}
		</UserContext.Provider>
	);
}
