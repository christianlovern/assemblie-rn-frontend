import { createContext, useContext, useState } from 'react';

export const UserContext = createContext();

export function useData() {
	return useContext(UserContext);
}

export function UserProvider(props) {
	const [auth, setAuth] = useState(false);
	const [user, setUser] = useState({});
	const [organization, setOrganization] = useState({});
	const [announcements, setAnnouncements] = useState({});
	const [events, setEvents] = useState({});
	const [ministries, setMinistries] = useState([]);
	const [selectedMinistry, setSelectedMinistry] = useState(null);
	const [familyMembers, setFamilyMembers] = useState([]);

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
	};

	return (
		<UserContext.Provider value={data}>
			{props.children}
		</UserContext.Provider>
	);
}
