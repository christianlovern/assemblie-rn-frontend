import { Platform } from 'react-native';
import axios from 'axios';

// const url =
// 	Platform.OS == 'android'
// 		? 'http://10.0.2.2:8000/'
// 		: 'http://localhost:8000/';

// const url = 'https://7d86-192-230-190-82.ngrok-free.app/'; //home
const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.229.62:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
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

export const signInUser = async (data) => {
	const headers = {
		'Content-Type': 'application/json',
	};

	try {
		const response = await axios.post(url + 'api/session/login', data, {
			headers,
		});
		return {
			data: response.data,
			status: response.status,
		};
	} catch (error) {
		if (error.response) {
			return {
				data: error.response.data,
				status: error.response.status,
			};
		} else if (error.request) {
			return {
				data: { message: 'Network error - no response received' },
				status: 0,
			};
		} else {
			return {
				data: { message: error.message },
				status: 0,
			};
		}
	}
};

export const signInGuest = async (data) => {
	const headers = {
		'Content-Type': 'application/json',
	};

	const response = await axios
		.post(url + 'api/session/guest-login', data, { headers })
		.catch((error) => {
			console.error('Login failed');
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.error('Status:', error.response.status);
				console.error('Data:', error.response.data);
			} else if (error.request) {
				// The request was made but no response was received
				console.error('No response received:', error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.error('Error:', error.message);
			}
		});

	return {
		data: response.data,
		status: response.status,
	};
};

export const signUpUser = async (data) => {
	const headers = {
		'Content-Type': 'application/json',
	};

	const response = await axios
		.post(url + 'api/users', data, { headers })
		.catch((error) => {
			console.error('Login failed');
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.error('Status:', error.response.status);
				console.error('Data:', error.response.data);
			} else if (error.request) {
				// The request was made but no response was received
				console.error('No response received:', error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.error('Error:', error.message);
			}
		});

	return {
		data: response.data,
		status: response.status,
	};
};

export const usersApi = {
	// Get all users for an organization
	getAll: async (orgId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/organizations/${orgId}/users`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch users:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},
	updateUser: async (userId, userData) => {
		try {
			const response = await axios.put(
				`${API_BASE_URL}/users/${userId}`,
				userData,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to update user:', error);
			throw error;
		}
	},
	leaveOrganization: async (orgId, userId) => {
		try {
			const response = await axios.delete(
				`${API_BASE_URL}/organizations/${orgId}/users/${userId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to leave organization:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},
	// Get all organizations that the user is a member of
	getMemberships: async () => {
		try {
			const response = await axiosInstance.get(
				'api/organizations/user/memberships'
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch user memberships:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			} else if (error.request) {
				console.error('No response received:', error.request);
			} else {
				console.error('Error setting up request:', error.message);
			}
			throw error;
		}
	},
	linkOrganization: async (organizationPin) => {
		try {
			const response = await axiosInstance.post(
				'api/users/link-organization-pin',
				{
					pin: organizationPin,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to link organization:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},
	sendPasswordResetEmail: async (email) => {
		try {
			const response = await axiosInstance.post(
				'api/users/forgot-password',
				{ email }
			);
			return response.data;
		} catch (error) {
			console.error('Failed to send reset email:', error);
			throw error.response?.data || error;
		}
	},
	resetPassword: async (email, code, newPassword) => {
		try {
			const response = await axiosInstance.post(
				'api/users/reset-password',
				{
					email,
					code,
					newPassword,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to reset password:', error);
			throw error.response?.data || error;
		}
	},
	changePassword: async (currentPassword, newPassword) => {
		try {
			const response = await axiosInstance.put(
				'api/users/change-password',
				{
					currentPassword,
					newPassword,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to change password:', error);
			throw error.response?.data || error;
		}
	},
	sendContactEmail: async (formData) => {
		try {
			const response = await axiosInstance.post(
				'api/contact',
				{
					...formData,
					isInquiry: true,
					subject: 'Mobile App Issue Report',
				},
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to send contact email:', error);
			if (error.response?.data) {
				throw error.response.data;
			}
			throw new Error('Failed to send message. Please try again later.');
		}
	},
};

export const teamsApi = {
	// Get all teams that the current user is a member of
	getMyTeams: async () => {
		try {
			const response = await axiosInstance.get('api/teams/my-teams');
			return response.data;
		} catch (error) {
			console.error('Failed to fetch user teams:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			} else if (error.request) {
				console.error('No response received:', error.request);
			} else {
				console.error('Error setting up request:', error.message);
			}
			throw error;
		}
	},
};
