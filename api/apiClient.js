import axios from 'axios';
import { TokenStorage } from './tokenStorage';

export const API_BASE_URL =
	'https://assemblie-backend-production.up.railway.app';

/** Token is considered expired after 10 minutes; refresh before then. */
const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Called after a successful token refresh so the app can refetch user/session data. */
let onTokenRefreshedCallback = null;
/** Called when refresh fails (e.g. 401) so the app can sign the user out. */
let onAuthLostCallback = null;

export function setOnTokenRefreshed(callback) {
	onTokenRefreshedCallback = callback;
}

export function setOnAuthLost(callback) {
	onAuthLostCallback = callback;
}

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
	console.log('[refreshAccessToken] Called');
	if (refreshPromise) {
		console.log('[refreshAccessToken] Reusing in-flight refresh promise');
		return refreshPromise;
	}
	const token = await TokenStorage.getToken();
	if (!token) {
		refreshPromise = null;
		console.log('[refreshAccessToken] No token — throw');
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
			console.log('[refreshAccessToken] Got new token from backend');
			return TokenStorage.setTokenWithTimestamp(newToken).then(
				() => newToken,
			);
		})
		.then((newToken) => {
			if (onTokenRefreshedCallback) {
				try {
					onTokenRefreshedCallback();
				} catch (e) {
					console.warn('onTokenRefreshed callback error:', e?.message);
				}
			}
			return newToken;
		})
		.finally(() => {
			refreshPromise = null;
		});
	return refreshPromise;
}

/** True if the token is expired or unknown age and should be refreshed (10 min expiry). */
async function shouldRefreshToken() {
	const setAt = await TokenStorage.getTokenSetAt();
	// No timestamp = legacy token or first load; refresh so we get a timestamp and valid token
	if (setAt == null) return true;
	return Date.now() - setAt >= TOKEN_REFRESH_INTERVAL_MS;
}

/**
 * Ensure we have a valid token before a request. Call this on app load before getCurrentSession
 * so an expired token is refreshed and the user stays logged in.
 * Does not throw: if refresh fails, the existing token is left in place and the caller can
 * still try getCurrentSession() (e.g. token might still be valid).
 */
export async function ensureValidToken() {
	const token = await TokenStorage.getToken();
	console.log('[ensureValidToken] token present:', !!token);
	if (!token) return;
	const shouldRefresh = await shouldRefreshToken();
	console.log('[ensureValidToken] shouldRefreshToken:', shouldRefresh);
	if (shouldRefresh) {
		try {
			console.log('[ensureValidToken] Calling refreshAccessToken()');
			await refreshAccessToken();
			console.log('[ensureValidToken] refreshAccessToken OK');
		} catch (e) {
			console.warn('[ensureValidToken] Token refresh failed, will try session with existing token:', e?.message);
			// Do not throw: let caller try getCurrentSession() with current token
		}
	}
}

// Request interceptor
apiClient.interceptors.request.use(
	async (config) => {
		try {
			// Proactive refresh: if token is expired (10 min), refresh before this request
			if (await shouldRefreshToken()) {
				try {
					await refreshAccessToken();
				} catch (e) {
					console.warn('Proactive token refresh failed:', e?.message);
				}
			}
			const token = await TokenStorage.getToken();
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
				const token = await TokenStorage.getToken();
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
				await TokenStorage.removeToken();
				if (onAuthLostCallback) {
					try {
						onAuthLostCallback();
					} catch (e) {
						console.warn('onAuthLost callback error:', e?.message);
					}
				}
			}
		}
		return Promise.reject(error);
	},
);

export default apiClient;
