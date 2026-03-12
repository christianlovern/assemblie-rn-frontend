import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';
const TOKEN_SET_AT_KEY = 'userTokenSetAt';
const SESSION_EMAIL_KEY = 'sessionUserEmail';

export const TokenStorage = {
	async setToken(token) {
		try {
			await SecureStore.setItemAsync(TOKEN_KEY, token);
		} catch (_) {}
	},

	/** Set token and record timestamp (used for 30‑minute refresh). */
	async setTokenWithTimestamp(token) {
		try {
			await SecureStore.setItemAsync(TOKEN_KEY, token);
			await SecureStore.setItemAsync(
				TOKEN_SET_AT_KEY,
				String(Date.now()),
			);
		} catch (error) {
			// Avoid logging token or error details in production
		}
	},

	async getToken() {
		try {
			const token = await SecureStore.getItemAsync(TOKEN_KEY);
			return token;
		} catch (_) {
			return null;
		}
	},

	/** When the token was set (ms since epoch), or null. */
	async getTokenSetAt() {
		try {
			const value = await SecureStore.getItemAsync(TOKEN_SET_AT_KEY);
			return value != null ? Number(value) : null;
		} catch (_) {
			return null;
		}
	},

	async removeToken() {
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			await SecureStore.deleteItemAsync(TOKEN_SET_AT_KEY);
			await SecureStore.deleteItemAsync(SESSION_EMAIL_KEY);
		} catch (_) {}
	},

	/** Persist current user email so it can be restored when GET /api/session doesn't return it. */
	async setSessionEmail(email) {
		if (email == null || String(email).trim() === '') return;
		try {
			await SecureStore.setItemAsync(SESSION_EMAIL_KEY, String(email).trim());
		} catch (_) {}
	},

	async getSessionEmail() {
		try {
			return await SecureStore.getItemAsync(SESSION_EMAIL_KEY);
		} catch (_) {
			return null;
		}
	},
};
