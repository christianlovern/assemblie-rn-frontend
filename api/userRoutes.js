import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import apiClient from './apiClient';
import { ensureFileUriForUpload } from './uploadRoutes';

const SCREENSHOT_MAX_WIDTH = 480;
const SCREENSHOT_COMPRESS = 0.4;
const SCREENSHOT_MAX_BASE64_LENGTH = 180000;

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
		throw error;
	}
};

export const usersApi = {
	// Get all users for an organization
	getAll: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/organizations/${orgId}/users`,
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	updateUser: async (userId, userData) => {
		try {
			const response = await apiClient.put(
				`/api/users/${userId}`,
				userData,
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	leaveOrganization: async (orgId, userId) => {
		try {
			const response = await apiClient.delete(
				`/api/organizations/${orgId}/users/${userId}`,
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	/** Permanently delete the current user's account (all churches). Requires password confirmation. */
	deleteAccount: async (password) => {
		try {
			await apiClient.delete('/api/users/me', { data: { password } });
		} catch (error) {
			throw error;
		}
	},

	getMemberships: async () => {
		try {
			const response = await apiClient.get(
				'/api/organizations/user/memberships',
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	linkOrganization: async (organizationPin) => {
		try {
			const response = await apiClient.post(
				'/api/users/link-organization-pin',
				{
					pin: organizationPin,
				},
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	sendPasswordResetEmail: async (email) => {
		try {
			const response = await apiClient.post(
				'/api/users/forgot-password',
				{ email },
			);
			return response.data;
		} catch (error) {
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
			throw error.response?.data || error;
		}
	},

	sendContactEmail: async (formData, screenshotUri = null) => {
		try {
			const payload = {
				name: String(formData.name ?? '').trim(),
				email: String(formData.email ?? '').trim(),
				message: String(formData.message ?? '').trim(),
				organizationName: String(
					formData.organizationName ?? '',
				).trim(),
				platform: formData.platform ?? Platform.OS,
				appVersion: String(formData.appVersion ?? ''),
				isInquiry: true,
				subject: formData.subject ?? 'Mobile App Issue Report',
			};
			if (formData.template) payload.template = formData.template;

			if (screenshotUri) {
				const file = await ensureFileUriForUpload({
					uri: screenshotUri,
					name: 'screenshot.jpg',
				});
				const manipulated = await ImageManipulator.manipulateAsync(
					file.uri,
					[{ resize: { width: SCREENSHOT_MAX_WIDTH } }],
					{
						compress: SCREENSHOT_COMPRESS,
						format: ImageManipulator.SaveFormat.JPEG,
					},
				);
				let base64 = await FileSystem.readAsStringAsync(
					manipulated.uri,
					{ encoding: 'base64' },
				);
				if (base64.length <= SCREENSHOT_MAX_BASE64_LENGTH) {
					payload.screenshotBase64 = base64;
				}
			}

			const response = await apiClient.post('/api/contact', payload);
			return response.data;
		} catch (error) {
			const msg =
				error.response?.data?.message ||
				error.message ||
				'Failed to send message. Please try again later.';
			throw new Error(msg);
		}
	},
};

export const teamsApi = {
	getMyTeams: async () => {
		try {
			const response = await apiClient.get('/api/teams/my-teams');
			return response.data;
		} catch (error) {
			throw error;
		}
	},
};
