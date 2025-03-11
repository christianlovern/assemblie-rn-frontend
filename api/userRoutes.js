import { Platform } from 'react-native';
import axios from 'axios';

// const url =
// 	Platform.OS == 'android'
// 		? 'http://10.0.2.2:8000/'
// 		: 'http://localhost:8000/';

// const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.229.62:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
const url = 'https://e78b-192-230-190-82.ngrok-free.app/';

const API_BASE_URL = `${url}api`;

export const signInUser = async (data) => {
	const headers = {
		'Content-Type': 'application/json',
	};

	try {
		const response = await axios.post(url + 'api/session/login', data, {
			headers,
		});
		console.log('response', response.data);
		return {
			data: response.data,
			status: response.status,
		};
	} catch (error) {
		console.error('Login failed');
		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Data:', error.response.data);
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
			const response = await axios.get(
				`${API_BASE_URL}/organizations/user/memberships`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch user memberships:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},
};
