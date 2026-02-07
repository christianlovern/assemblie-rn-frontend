import { io } from 'socket.io-client';
import { API_BASE_URL } from './apiClient';
import { TokenStorage } from './tokenStorage';

let socket = null;

/**
 * Connect to the team chat Socket.io server with the current JWT.
 * Call after ensuring the user has a valid token.
 * @param {string} accessToken - Bearer token (with or without "Bearer " prefix)
 * @returns {import('socket.io-client').Socket}
 */
export function connectTeamChatSocket(accessToken) {
	if (socket?.connected) return socket;
	const token =
		accessToken && accessToken.startsWith('Bearer ')
			? accessToken.slice(7)
			: accessToken;
	socket = io(API_BASE_URL, {
		path: '/socket.io',
		auth: { token: token || undefined },
	});
	return socket;
}

/**
 * Disconnect the socket.
 */
export function disconnectTeamChatSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}

/**
 * Get the current socket instance (may be null).
 * @returns {import('socket.io-client').Socket | null}
 */
export function getTeamChatSocket() {
	return socket;
}

/**
 * Join a team room. Call when the user opens that team's chat.
 * @param {number} teamId
 * @param {(res: { error?: string, ok?: boolean }) => void} [callback]
 */
export function joinTeamRoom(teamId, callback) {
	if (!socket) {
		callback?.({ error: 'Not connected' });
		return;
	}
	socket.emit('join_team', { teamId }, callback || (() => {}));
}

/**
 * Leave a team room. Call when the user leaves that team's chat.
 * @param {number} teamId
 */
export function leaveTeamRoom(teamId) {
	if (socket) socket.emit('leave_team', { teamId });
}

/**
 * Subscribe to new messages (full message object, same as POST response).
 * @param {(message: object) => void} handler
 * @returns {() => void} Unsubscribe function
 */
export function onNewTeamMessage(handler) {
	if (!socket) return () => {};
	socket.on('newMessage', handler);
	return () => socket.off('newMessage', handler);
}
