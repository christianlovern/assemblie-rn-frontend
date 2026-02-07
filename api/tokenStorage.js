import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';
const TOKEN_SET_AT_KEY = 'userTokenSetAt';

export const TokenStorage = {
	async setToken(token) {
		try {
			await SecureStore.setItemAsync(TOKEN_KEY, token);
		} catch (error) {
			console.error('Error saving token:', error);
		}
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
			console.error('Error saving token:', error);
		}
	},

	async getToken() {
		try {
			return await SecureStore.getItemAsync(TOKEN_KEY);
		} catch (error) {
			console.error('Error getting token:', error);
			return null;
		}
	},

	/** When the token was set (ms since epoch), or null. */
	async getTokenSetAt() {
		try {
			const value = await SecureStore.getItemAsync(TOKEN_SET_AT_KEY);
			return value != null ? Number(value) : null;
		} catch (error) {
			console.error('Error getting token timestamp:', error);
			return null;
		}
	},

	async removeToken() {
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			await SecureStore.deleteItemAsync(TOKEN_SET_AT_KEY);
		} catch (error) {
			console.error('Error removing token:', error);
		}
	},
};
