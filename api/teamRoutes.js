import axios from 'axios';

// const url = 'https://7d86-192-230-190-82.ngrok-free.app/'; //home
const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
// const url = 'http://localhost:8000/';
// const url = 'https://34ae-192-230-190-82.ngrok-free.app/';

// Create an axios instance with the same configuration as userRoutes
const axiosInstance = axios.create({
	baseURL: url,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
	proxy: false,
});

// Add request/response interceptors for debugging
axiosInstance.interceptors.request.use((request) => {
	console.log('Starting Teams Request:', {
		url: request.url,
		method: request.method,
		headers: request.headers,
	});
	return request;
});

axiosInstance.interceptors.response.use(
	(response) => {
		console.log('Teams Response:', {
			status: response.status,
			data: response.data,
		});
		return response;
	},
	(error) => {
		console.error('Teams Response Error:', {
			message: error.message,
			response: error.response?.data,
		});
		return Promise.reject(error);
	}
);

export const teamsApi = {
	// Get all teams for an organization
	getAll: async (orgId) => {
		try {
			const response = await axiosInstance.get(
				`api/organizations/${orgId}/teams`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch teams:', error);
			throw error;
		}
	},

	// Get specific team details
	getOne: async (orgId, teamId) => {
		try {
			const response = await axiosInstance.get(
				`api/organizations/${orgId}/teams/${teamId}`
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
			const response = await axiosInstance.get(
				`api/organizations/${orgId}/teams/${teamId}`
			);
			return { users: response.data.team.members }; // Format response to match expected structure
		} catch (error) {
			console.error('Failed to fetch team users:', error);
			throw error;
		}
	},

	// Get plans for a team
	getTeamPlans: async (teamId, status) => {
		try {
			const queryParams = status ? `?status=${status}` : '';
			const response = await axiosInstance.get(
				`api/plans/team/${teamId}${queryParams}`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch team plans:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Get a specific plan by ID
	getPlan: async (planId) => {
		try {
			const response = await axiosInstance.get(`api/plans/${planId}`);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch plan:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},
};
