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
			console.log('[TokenStorage] setTokenWithTimestamp OK, token length:', token?.length);
		} catch (error) {
			console.error('[TokenStorage] Error saving token:', error);
		}
	},

	async getToken() {
		try {
			const token = await SecureStore.getItemAsync(TOKEN_KEY);
			// Log only null to reduce noise; session restore path also logs "[SessionRestore] Token from storage"
			if (!token) console.log('[TokenStorage] getToken: null');
			return token;
		} catch (error) {
			console.error('[TokenStorage] Error getting token:', error);
			return null;
		}
	},

	/** When the token was set (ms since epoch), or null. */
	async getTokenSetAt() {
		try {
			const value = await SecureStore.getItemAsync(TOKEN_SET_AT_KEY);
			const result = value != null ? Number(value) : null;
			if (result == null) console.log('[TokenStorage] getTokenSetAt: null');
			return result;
		} catch (error) {
			console.error('[TokenStorage] Error getting token timestamp:', error);
			return null;
		}
	},

	async removeToken() {
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			await SecureStore.deleteItemAsync(TOKEN_SET_AT_KEY);
			console.log('[TokenStorage] removeToken called — token and timestamp deleted');
		} catch (error) {
			console.error('[TokenStorage] Error removing token:', error);
		}
	},
};
