import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './apiClient'; 

// Remove these interceptors from apiClient.js and keep them only in teamRoutes.js
const teamApiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add auth token interceptor
teamApiClient.interceptors.request.use(
	async (config) => {
		try {
			const token = await SecureStore.getItemAsync('userToken');
			if (token) {
				config.headers.Authorization = token.startsWith('Bearer ')
					? token
					: `Bearer ${token}`;
			}
			return config;
		} catch (error) {
			console.error('Error setting auth header:', error);
			return config;
		}
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Debugging interceptors
teamApiClient.interceptors.request.use((request) => {
	console.log('Starting Teams Request:', {
		url: request.url,
		method: request.method,
		headers: request.headers,
	});
	return request;
});

teamApiClient.interceptors.response.use(
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

// Use teamApiClient for team-related requests
export const teamsApi = {
	// Get all teams for an organization
	getAll: async (orgId) => {

		try {
			const response = await teamApiClient.get(
				`/api/organizations/${orgId}/teams`
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
			const response = await teamApiClient.get(
				`/api/organizations/${orgId}/teams/${teamId}`
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
			const response = await teamApiClient.get(
				`/api/organizations/${orgId}/teams/${teamId}`
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
			const response = await teamApiClient.get(
				`/api/plans/team/${teamId}`,
				{
					params: status ? { status } : undefined,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch team plans:', error);
			throw error;
		}
	},

	// Get a specific plan by ID
	getPlan: async (planId) => {
		try {
			const response = await teamApiClient.get(`/api/plans/${planId}`);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch plan:', error);
			throw error;
		}
	},
};
