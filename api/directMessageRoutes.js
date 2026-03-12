import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import apiClient, { API_BASE_URL } from './apiClient';
import { TokenStorage } from './tokenStorage';
import {
	MAX_FILES,
	MAX_FILE_BYTES,
	isAllowedMime,
} from './teamChatRoutes';

const MAX_CONTENT_LENGTH = 10000;

/**
 * Direct messages API. All endpoints require Authorization: Bearer <token>.
 * Base path: /api/direct-messages
 */
export const directMessageApi = {
	/**
	 * Get users the current user can message (same org, share at least one team).
	 * @returns {{ users: Array<{ id, firstName, lastName, email?, userPhoto? }> }}
	 */
	getEligibleUsers: async () => {
		const response = await apiClient.get('/api/direct-messages/eligible-users');
		return response.data;
	},

	/**
	 * List current user's DM conversations.
	 * @returns {{ conversations: Array<{ id, otherUser, lastMessage? }> }}
	 */
	getConversations: async () => {
		const response = await apiClient.get('/api/direct-messages/conversations');
		return response.data;
	},

	/**
	 * Create or get conversation with a user. Returns existing if already exists.
	 * @param {number} otherUserId
	 * @returns {{ conversation: { id, otherUser } }}
	 */
	createOrGetConversation: async (otherUserId) => {
		const response = await apiClient.post('/api/direct-messages/conversations', {
			otherUserId,
		});
		return response.data;
	},

	/**
	 * List messages in a conversation (newest first). Use before for load older.
	 * @param {number} conversationId
	 * @param {{ limit?: number, before?: number | string }} params
	 * @returns {{ messages: Array, hasMore: boolean }}
	 */
	getMessages: async (conversationId, params = {}) => {
		const { limit = 50, before } = params;
		const query = {};
		if (limit != null) query.limit = Math.min(limit, 100);
		if (before != null) query.before = before;
		const response = await apiClient.get(
			`/api/direct-messages/conversations/${conversationId}/messages`,
			{ params: query },
		);
		return response.data;
	},

	/**
	 * Send a message in a conversation (text only = JSON; with files = multipart).
	 * @param {number} conversationId
	 * @param {{ content?: string, files?: Array<{ uri: string, name?: string, mimeType?: string, size?: number }> }} body - max 10000 chars; files max 5, each ≤ 25 MB
	 * @returns {{ message: object }}
	 */
	sendMessage: async (conversationId, body = {}) => {
		const content =
			typeof body.content === 'string'
				? body.content.trim().slice(0, MAX_CONTENT_LENGTH)
				: '';
		const files = Array.isArray(body.files) ? body.files : [];

		if (files.length > 0) {
			if (files.length > MAX_FILES) {
				throw new Error(`Maximum ${MAX_FILES} files per message`);
			}
			let resolvedFiles = files;
			if (Platform.OS === 'android') {
				resolvedFiles = await Promise.all(
					files.map(async (file, index) => {
						const uri = file.uri || '';
						if (!uri.startsWith('content://')) return file;
						const ext =
							(file.name && file.name.includes('.')
								? file.name.slice(file.name.lastIndexOf('.'))
								: '') || '.bin';
						const cachePath = `${FileSystemLegacy.cacheDirectory}dm_upload_${Date.now()}_${index}${ext}`;
						try {
							await FileSystemLegacy.copyAsync({
								from: uri,
								to: cachePath,
							});
							return { ...file, uri: cachePath };
						} catch (copyErr) {
							throw copyErr;
						}
					}),
				);
			}
			const form = new FormData();
			form.append('content', content);
			resolvedFiles.forEach((file) => {
				if (file.size != null && file.size > MAX_FILE_BYTES) {
					throw new Error('Each file must be 25 MB or smaller');
				}
				if (file.mimeType && !isAllowedMime(file.mimeType)) {
					throw new Error(`File type not allowed: ${file.mimeType}`);
				}
				const filePayload = {
					uri: file.uri,
					name: file.name || 'file',
					type: file.mimeType || 'application/octet-stream',
				};
				// Backend accepts 'files' or 'file'; use 'file' for each part (common for multipart)
				form.append('file', filePayload);
			});
			try {
				if (Platform.OS === 'android') {
					const token = await TokenStorage.getToken();
					const authHeader = token?.startsWith('Bearer ')
						? token
						: token
							? `Bearer ${token}`
							: '';
					const res = await fetch(
						`${API_BASE_URL}/api/direct-messages/conversations/${conversationId}/messages`,
						{
							method: 'POST',
							headers: authHeader
								? { Authorization: authHeader }
								: {},
							body: form,
						},
					);
					const data = await res.json().catch(() => ({}));
					if (!res.ok) {
						const err = new Error(
							data?.message ||
								data?.error ||
								data?.errors?.[0] ||
								`Request failed ${res.status}`,
						);
						err.response = { status: res.status, data };
						throw err;
					}
					return data;
				}
				const response = await apiClient.post(
					`/api/direct-messages/conversations/${conversationId}/messages`,
					form,
				);
				return response.data;
			} catch (postErr) {
				// Ensure we attach response for UI to show status/message
				if (postErr?.response == null && postErr?.message) {
					postErr.response = {
						status: 0,
						data: { message: postErr.message },
					};
				}
				throw postErr;
			}
		}

		const response = await apiClient.post(
			`/api/direct-messages/conversations/${conversationId}/messages`,
			{ content },
		);
		return response.data;
	},

	/**
	 * Add a reaction to a message. Returns the full message with updated reactions.
	 * @param {number} conversationId
	 * @param {number} messageId
	 * @param {string} type - heart | thumbsup | thumbsdown | laugh | sad | angry
	 * @returns {Promise<object>} Full message object
	 */
	addReaction: async (conversationId, messageId, type) => {
		const response = await apiClient.post(
			`/api/direct-messages/conversations/${conversationId}/messages/${messageId}/reactions`,
			{ type },
		);
		// Backend may return full message as body or wrapped as { message }
		return response.data?.message ?? response.data;
	},

	/**
	 * Remove current user's reaction from a message. Returns the full message with updated reactions.
	 * @param {number} conversationId
	 * @param {number} messageId
	 * @param {string} type - heart | thumbsup | thumbsdown | laugh | sad | angry
	 * @returns {Promise<object>} Full message object
	 */
	removeReaction: async (conversationId, messageId, type) => {
		const response = await apiClient.delete(
			`/api/direct-messages/conversations/${conversationId}/messages/${messageId}/reactions/${type}`,
		);
		return response.data?.message ?? response.data;
	},

	/**
	 * Get a signed URL to download an attachment.
	 * @param {number} conversationId
	 * @param {number} messageId
	 * @param {number} attachmentId
	 * @returns {{ url: string }}
	 */
	getAttachmentDownloadUrl: async (conversationId, messageId, attachmentId) => {
		const response = await apiClient.get(
			`/api/direct-messages/conversations/${conversationId}/messages/${messageId}/attachments/${attachmentId}/download`,
		);
		return response.data;
	},
};

export { MAX_CONTENT_LENGTH as DM_MAX_CONTENT_LENGTH, MAX_FILES as DM_MAX_FILES, MAX_FILE_BYTES as DM_MAX_FILE_BYTES };
