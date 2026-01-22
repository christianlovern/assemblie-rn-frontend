import apiClient from './apiClient';

// Authentication endpoints
export const signInUser = async (data) => {
	try {
		const response = await apiClient.post('/api/session/login', data);
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
	try {
		const response = await apiClient.post('/api/session/guest-login', data);
		return {
			data: response.data,
			status: response.status,
		};
	} catch (error) {
		console.error('Login failed:', error?.response?.data || error.message);
		// Return a structured error response instead of throwing
		return {
			data: {
				message:
					error.response?.data?.message ||
					'Unable to process guest login',
			},
			status: error.response?.status || 500,
		};
	}
};

export const signUpUser = async (data) => {
	try {
		const response = await apiClient.post('/api/users', data);
		return {
			data: response.data,
			status: response.status,
		};
	} catch (error) {
		console.error('Signup failed');
		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Data:', error.response.data);
		} else if (error.request) {
			console.error('No response received:', error.request);
		} else {
			console.error('Error:', error.message);
		}
		throw error;
	}
};

export const usersApi = {
	// Get all users for an organization
	getAll: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/organizations/${orgId}/users`
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
			const response = await apiClient.put(
				`/api/users/${userId}`,
				userData
			);
			return response.data;
		} catch (error) {
			console.error('Failed to update user:', error);
			throw error;
		}
	},

	leaveOrganization: async (orgId, userId) => {
		try {
			const response = await apiClient.delete(
				`/api/organizations/${orgId}/users/${userId}`
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

	getMemberships: async () => {
		try {
			const response = await apiClient.get(
				'/api/organizations/user/memberships'
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
			const response = await apiClient.post(
				'/api/users/link-organization-pin',
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
			const response = await apiClient.post(
				'/api/users/forgot-password',
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
			const response = await apiClient.post('/api/users/reset-password', {
				email,
				code,
				newPassword,
			});
			return response.data;
		} catch (error) {
			console.error('Failed to reset password:', error);
			throw error.response?.data || error;
		}
	},

	changePassword: async (currentPassword, newPassword) => {
		try {
			const response = await apiClient.put('/api/users/change-password', {
				currentPassword,
				newPassword,
			});
			return response.data;
		} catch (error) {
			console.error('Failed to change password:', error);
			throw error.response?.data || error;
		}
	},

	sendContactEmail: async (formData) => {
		try {
			const response = await apiClient.post('/api/contact', {
				...formData,
				isInquiry: true,
				subject: 'Mobile App Issue Report',
			});
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
	getMyTeams: async () => {
		try {
			const response = await apiClient.get('/api/teams/my-teams');
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
