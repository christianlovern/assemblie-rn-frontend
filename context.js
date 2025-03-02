import { createContext, useContext, useState } from 'react';

export const UserContext = createContext();

export function useData() {
	return useContext(UserContext);
}

const dummyMinistries = [
	{
		id: 1,
		name: 'Sunday School',
		description: 'Sunday School Ministry',
		isActive: true,
		inactiveMessage: 'Sunday School is currently not active',
	},
	{
		id: 2,
		name: 'Youth Group',
		description: 'Youth Group Ministry',
		isActive: true,
		inactiveMessage: 'Youth Group is currently not active',
	},
	{
		id: 3,
		name: 'Bible Study',
		description: 'Bible Study Ministry',
		isActive: false,
		inactiveMessage: 'Bible Study is currently not active',
	},
];

const dummyFamilyMembers = [
	{
		id: 1,
		firstName: 'John',
		lastName: 'Doe',
	},
	{
		id: 2,
		firstName: 'Jane',
		lastName: 'Doe',
	},
	{
		id: 3,
		firstName: 'John',
		lastName: 'Smith',
	},
	{
		id: 4,
		firstName: 'Jane',
		lastName: 'Smith',
	},
];

export function UserProvider(props) {
	const [auth, setAuth] = useState(false);
	const [user, setUser] = useState({});
	const [organization, setOrganization] = useState({});
	const [announcements, setAnnouncements] = useState({});
	const [events, setEvents] = useState({});
	const [ministries, setMinistries] = useState(dummyMinistries);
	const [familyMembers, setFamilyMembers] = useState(dummyFamilyMembers);

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
	};

	return (
		<UserContext.Provider value={data}>
			{props.children}
		</UserContext.Provider>
	);
}
