import * as SecureStore from 'expo-secure-store';

export const TokenStorage = {
	async setToken(token) {
		try {
			await SecureStore.setItemAsync('userToken', token);
		} catch (error) {
			console.error('Error saving token:', error);
		}
	},

	async getToken() {
		try {
			return await SecureStore.getItemAsync('userToken');
		} catch (error) {
			console.error('Error getting token:', error);
			return null;
		}
	},

	async removeToken() {
		try {
			await SecureStore.deleteItemAsync('userToken');
		} catch (error) {
			console.error('Error removing token:', error);
		}
	},
};
