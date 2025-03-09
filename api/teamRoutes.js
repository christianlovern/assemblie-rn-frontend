import axios from 'axios';

const url = 'http://192.168.1.129:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
const API_BASE_URL = `${url}api`;

export const teamsApi = {
	// Get all teams for an organization
	getAll: async (orgId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/organizations/${orgId}/teams`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch teams:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Get specific team details
	getOne: async (orgId, teamId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/organizations/${orgId}/teams/${teamId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch team:', error);
			throw error;
		}
	},

	// Get all users in a team
	getTeamUsers: async (orgId, teamId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/organizations/${orgId}/teams/${teamId}/users`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch team users:', error);
			throw error;
		}
	},
};
