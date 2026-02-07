import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { TokenStorage } from './tokenStorage';

export const API_BASE_URL =
	'https://assemblie-backend-production.up.railway.app';

/** Refresh the token every 30 minutes. */
const TOKEN_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

/** Single in-flight refresh promise so multiple 401s don't trigger multiple refreshes. */
let refreshPromise = null;

/**
 * Call backend to refresh the access token. Uses a direct axios post so it does not
 * go through our response interceptor (avoids retry loop).
 * Backend must expose: POST /api/session/refresh
 * - Request: current Authorization header (Bearer <access token>).
 * - Response: { token: string } (new access token).
 */
async function refreshAccessToken() {
	if (refreshPromise) return refreshPromise;
	const token = await SecureStore.getItemAsync('userToken');
	if (!token) {
		refreshPromise = null;
		throw new Error('No token to refresh');
	}
	const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
	refreshPromise = axios
		.post(
			`${API_BASE_URL}/api/session/refresh`,
			{},
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: authHeader,
				},
			},
		)
		.then((res) => {
			const newToken = res.data?.token;
			if (!newToken) throw new Error('Refresh response missing token');
			return TokenStorage.setTokenWithTimestamp(newToken).then(
				() => newToken,
			);
		})
		.finally(() => {
			refreshPromise = null;
		});
	return refreshPromise;
}

/** True if the token is older than 30 minutes and should be refreshed. No timestamp = don't refresh proactively (only on 401). */
async function shouldRefreshToken() {
	const setAt = await TokenStorage.getTokenSetAt();
	if (setAt == null) return false;
	return Date.now() - setAt >= TOKEN_REFRESH_INTERVAL_MS;
}

// Request interceptor
apiClient.interceptors.request.use(
	async (config) => {
		try {
			// Proactive refresh: if token is older than 30 minutes, refresh before this request
			if (await shouldRefreshToken()) {
				try {
					await refreshAccessToken();
				} catch (e) {
					console.warn('Proactive token refresh failed:', e?.message);
				}
			}
			const token = await SecureStore.getItemAsync('userToken');
			if (token) {
				config.headers.Authorization = token.startsWith('Bearer ')
					? token
					: `Bearer ${token}`;
			}
			// Let axios set multipart boundary when sending FormData
			if (
				typeof FormData !== 'undefined' &&
				config.data instanceof FormData
			) {
				delete config.headers['Content-Type'];
			}
			return config;
		} catch (error) {
			console.error('Error setting auth header:', error);
			return config;
		}
	},
	(error) => Promise.reject(error),
);

// Response interceptor: on 401, try refresh once then retry the request
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry
		) {
			originalRequest._retry = true;
			try {
				await refreshAccessToken();
				const token = await SecureStore.getItemAsync('userToken');
				if (token) {
					originalRequest.headers.Authorization = token.startsWith(
						'Bearer ',
					)
						? token
						: `Bearer ${token}`;
				}
				return apiClient(originalRequest);
			} catch (refreshError) {
				console.warn(
					'Token refresh failed on 401:',
					refreshError?.message,
				);
			}
		}
		return Promise.reject(error);
	},
);

export default apiClient;
