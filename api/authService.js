import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';
import { TokenStorage } from './tokenStorage';

export const authService = {
	// Login user
	async login(email, password) {
		try {
			const response = await apiClient.post('/api/session/login', {
				email,
				password,
			});

			// Store the token and timestamp for 10‑minute refresh
			const token = response.data.token;
			await TokenStorage.setTokenWithTimestamp(token);
			const user = response.data.user;
			if (user?.email) await TokenStorage.setSessionEmail(user.email);

			return {
				user,
				organizations: response.data.organizations,
				token,
			};
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Login failed');
		}
	},

	// Guest login
	async guestLogin(orgPin) {
		try {
			const response = await apiClient.post('/api/session/guest-login', {
				orgPin,
			});

			const token = response.data.token;
			await TokenStorage.setTokenWithTimestamp(token);
			const user = response.data.user;
			if (user?.email) await TokenStorage.setSessionEmail(user.email);

			return {
				user,
				token,
			};
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Guest login failed',
			);
		}
	},

	// Sign up user
	async signup(userData) {
		try {
			const response = await apiClient.post('/api/users', userData);

			// Store the token and timestamp for 10‑minute refresh
			const token = response.data.token;
			await TokenStorage.setTokenWithTimestamp(token);
			const user = response.data.user;
			if (user?.email) await TokenStorage.setSessionEmail(user.email);

			return {
				user,
				token,
			};
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Signup failed');
		}
	},

	// Logout
	async logout() {
		try {
			await apiClient.delete('/api/session/logout');
			await TokenStorage.removeToken();
		} catch (error) {
			await TokenStorage.removeToken();
		}
	},

	// Verify token
	async verifyToken() {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return null;

			const response = await apiClient.get('/api/session/verify');
			return response.data.valid ? response.data.user : null;
		} catch (_) {
			return null;
		}
	},

	// Get current session
	async getCurrentSession() {
		try {
			const response = await apiClient.get('/api/session');
			return response.data?.user;
		} catch (_) {
			return null;
		}
	},
};
