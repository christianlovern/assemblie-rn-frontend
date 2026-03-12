import axios from 'axios';
import { TokenStorage } from './tokenStorage';

export const API_BASE_URL =
	'https://assemblie-backend-production.up.railway.app';

/** Token is considered stale after 7 minutes; refresh before then so we never send an expired token. */
const TOKEN_REFRESH_INTERVAL_MS = 7 * 60 * 1000;

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

/** Reset so the next 401 can trigger onAuthLost again (e.g. after user logs in again). */
export function resetAuthLostFlag() {
	authLostFired = false;
}

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

/** Single in-flight refresh promise so multiple 401s don't trigger multiple refreshes. */
let refreshPromise = null;
/** Prevents firing onAuthLostCallback multiple times (e.g. 401 from unregister after sign-out). */
let authLostFired = false;

/**
 * Call backend to refresh the access token. Uses a direct axios post so it does not
 * go through our response interceptor (avoids retry loop).
 * Backend must expose: POST /api/session/refresh
 * - Request: current Authorization header (Bearer <access token>).
 * - Response: { token: string } (new access token).
 */
async function refreshAccessToken() {
	if (refreshPromise) {
		return refreshPromise;
	}
	const token = await TokenStorage.getToken();
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
		.then((newToken) => {
			if (onTokenRefreshedCallback) {
				try {
					onTokenRefreshedCallback();
				} catch (_) {}
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
 * @returns {Promise<boolean>} true if the token is valid (or was refreshed), false if refresh was attempted and failed with 401 (caller should remove token / show auth).
 * Does not throw: on refresh failure we return false only for 401; other errors return true so caller can still try getCurrentSession (e.g. transient network).
 */
export async function ensureValidToken() {
	const token = await TokenStorage.getToken();
	if (!token) return false;
	const shouldRefresh = await shouldRefreshToken();
	if (shouldRefresh) {
		try {
			await refreshAccessToken();
			return true;
		} catch (e) {
			return e?.response?.status !== 401;
		}
	}
	return true;
}

// Request interceptor: refresh token if stale, then attach current token.
// Proactive refresh here avoids sending expired tokens and prevents 401 → logout.
apiClient.interceptors.request.use(
	async (config) => {
		try {
			const token = await TokenStorage.getToken();
			if (token && (await shouldRefreshToken())) {
				try {
					await refreshAccessToken();
				} catch (e) {
					// Refresh failed (e.g. network or 401); still send request with current token.
					// Response interceptor will retry refresh on 401 and only then sign out if refresh returns 401.
				}
			}
			const currentToken = await TokenStorage.getToken();
			if (currentToken) {
				config.headers.Authorization = currentToken.startsWith('Bearer ')
					? currentToken
					: `Bearer ${currentToken}`;
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
			const refresh401 = refreshError?.response?.status === 401;
			if (!refresh401) {
				return Promise.reject(error);
			}
			const tokenStillPresent = await TokenStorage.getToken();
			if (tokenStillPresent && onAuthLostCallback && !authLostFired) {
				authLostFired = true;
				try {
					await Promise.resolve(onAuthLostCallback());
				} catch (_) {}
			}
			await TokenStorage.removeToken();
		}
		}
		return Promise.reject(error);
	},
);

export default apiClient;
