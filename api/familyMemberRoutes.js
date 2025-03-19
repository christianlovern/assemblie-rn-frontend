import axios from 'axios';
import { Platform } from 'react-native';

// const url = 'https://7d86-192-230-190-82.ngrok-free.app/'; //home
const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
// const url = 'http://localhost:8000/';
// const url = 'https://34ae-192-230-190-82.ngrok-free.app/';

const API_BASE_URL = `${url}api`;

// Create an axios instance with the base configuration
const axiosInstance = axios.create({
	baseURL: url,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
});

export const familyMembersApi = {
	// Get all family members for the current user
	getAll: async () => {
		try {
			const response = await axiosInstance.get(
				'api/users/family-members'
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch family members:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Add a new family member
	create: async (familyMemberData) => {
		try {
			const response = await axiosInstance.post(
				'api/users/family-members',
				familyMemberData
			);
			return response.data;
		} catch (error) {
			console.error('Failed to create family member:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Update a family member
	update: async (familyMemberId, updateData) => {
		try {
			const response = await axiosInstance.put(
				`api/users/family-members/${familyMemberId}`,
				updateData
			);
			return response.data;
		} catch (error) {
			console.error('Failed to update family member:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Delete a family member
	delete: async (familyMemberId) => {
		try {
			const response = await axiosInstance.delete(
				`api/users/family-members/${familyMemberId}`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to delete family member:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Connect with another user as family
	connect: async (connectionUserId) => {
		try {
			const response = await axiosInstance.post(
				'api/users/family-members/connect',
				{ connectionUserId }
			);
			return response.data;
		} catch (error) {
			console.error('Failed to create family connection:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Accept or reject a family connection request
	respondToConnection: async (senderId, accept) => {
		try {
			const response = await axiosInstance.put(
				'api/users/family-members/connect',
				{ senderId, accept }
			);
			return response.data;
		} catch (error) {
			console.error('Failed to respond to connection request:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	// Search users by name
	searchByName: async (query) => {
		try {
			const response = await axiosInstance.get('api/users/search/name', {
				params: { query },
			});
			return response.data;
		} catch (error) {
			console.error('Failed to search users:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},

	acceptConnection: async (memberId) => {
		try {
			const response = await axiosInstance.post(
				`/family-members/accept/${memberId}`
			);
			return response.data;
		} catch (error) {
			console.error('Error accepting connection:', error);
			throw error.response?.data || error;
		}
	},

	rejectConnection: async (memberId) => {
		try {
			const response = await axiosInstance.post(
				`/family-members/reject/${memberId}`
			);
			return response.data;
		} catch (error) {
			console.error('Error rejecting connection:', error);
			throw error.response?.data || error;
		}
	},
};
