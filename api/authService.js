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

			// Store the token and timestamp for 30‑minute refresh
			const token = response.data.token;
			await TokenStorage.setTokenWithTimestamp(token);

			return {
				user: response.data.user,
				organizations: response.data.organizations,
				token,
			};
		} catch (error) {
			console.error('Login error:', error);
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

			return {
				user: response.data.user,
				token,
			};
		} catch (error) {
			console.error('Guest login error:', error);
			throw new Error(
				error.response?.data?.message || 'Guest login failed',
			);
		}
	},

	// Sign up user
	async signup(userData) {
		try {
			const response = await apiClient.post('/api/users', userData);

			// Store the token and timestamp for 30‑minute refresh
			const token = response.data.token;
			await TokenStorage.setTokenWithTimestamp(token);

			return {
				user: response.data.user,
				token,
			};
		} catch (error) {
			console.error('Signup error:', error);
			throw new Error(error.response?.data?.message || 'Signup failed');
		}
	},

	// Logout
	async logout() {
		try {
			await apiClient.delete('/api/session/logout');
			await TokenStorage.removeToken();
		} catch (error) {
			console.error('Logout error:', error);
			// Still remove the token even if the API call fails
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
		} catch (error) {
			console.error('Token verification error:', error);
			return null;
		}
	},

	// Get current session
	async getCurrentSession() {
		try {
			const response = await apiClient.get('/api/session');
			return response.data.user;
		} catch (error) {
			console.error('Get session error:', error);
			return null;
		}
	},
};
