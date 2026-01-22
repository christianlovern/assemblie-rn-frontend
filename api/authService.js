import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';

export const authService = {
	// Login user
	async login(email, password) {
		try {
			const response = await apiClient.post('/api/session/login', {
				email,
				password,
			});

			// Store the token
			const token = response.data.token;
			await SecureStore.setItemAsync('userToken', token);

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
			await SecureStore.setItemAsync('userToken', token);

			return {
				user: response.data.user,
				token,
			};
		} catch (error) {
			console.error('Guest login error:', error);
			throw new Error(
				error.response?.data?.message || 'Guest login failed'
			);
		}
	},

	// Sign up user
	async signup(userData) {
		try {
			const response = await apiClient.post('/api/users', userData);

			// Store the token that comes back from signup
			const token = response.data.token;
			await SecureStore.setItemAsync('userToken', token);

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
			await SecureStore.deleteItemAsync('userToken');
		} catch (error) {
			console.error('Logout error:', error);
			// Still remove the token even if the API call fails
			await SecureStore.deleteItemAsync('userToken');
		}
	},

	// Verify token
	async verifyToken() {
		try {
			const token = await SecureStore.getItemAsync('userToken');
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
