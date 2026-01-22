import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://assemblie-backend-production.up.railway.app';

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor
apiClient.interceptors.request.use(
	async (config) => {
		try {
			const token = await SecureStore.getItemAsync('userToken');
			if (token) {
				// Make sure we're using the full token string including 'Bearer'
				config.headers.Authorization = token.startsWith('Bearer ')
					? token
					: `Bearer ${token}`;
			}
			return config;
		} catch (error) {
			console.error('Error setting auth header:', error);
			return config;
		}
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			console.log('Received 401 error, token might be invalid');
			// You might want to handle token refresh or logout here
		}
		return Promise.reject(error);
	}
);

export default apiClient;
