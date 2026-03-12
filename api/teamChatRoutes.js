import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import apiClient, { API_BASE_URL } from './apiClient';

const MAX_CONTENT_LENGTH = 10000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Allowed MIME types for attachments (images, video, audio, PDF, Office, text). */
const ALLOWED_MIME_PREFIXES = [
	'image/',
	'video/',
	'audio/',
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.',
	'application/msword', // .doc
	'application/vnd.ms-excel', // .xls
	'text/plain',
	'text/csv',
];

function isAllowedMime(mime) {
	if (!mime) return false;
	return ALLOWED_MIME_PREFIXES.some((p) => mime === p || mime.startsWith(p));
}

/**
 * Team chat API. All endpoints require Authorization: Bearer <token>.
 * Base path: /api/teams
 */
export const teamChatApi = {
	/**
	 * List messages (paginated, newest first).
	 * @param {number} teamId
	 * @param {{ limit?: number, before?: number | string }} params - before: message id or ISO date of oldest on page
	 * @returns {{ messages: Array, hasMore: boolean }}
	 */
	getMessages: async (teamId, params = {}) => {
		const { limit = 50, before } = params;
		const query = {};
		if (limit != null) query.limit = Math.min(limit, 100);
		if (before != null) query.before = before;
		const response = await apiClient.get(`/api/teams/${teamId}/messages`, {
			params: query,
		});
		return response.data;
	},

	/**
	 * Send a new message (text only = JSON; with files = multipart).
	 * @param {number} teamId
	 * @param {{ content?: string, files?: Array<{ uri: string, name?: string, mimeType?: string, size?: number }> }} body - content max 10000 chars; files max 5, each ≤ 25 MB, allowed types
	 * @returns Message object with id, author, attachments, etc.
	 */
	sendMessage: async (teamId, body = {}) => {
		const content =
			typeof body.content === 'string'
				? body.content.trim().slice(0, MAX_CONTENT_LENGTH)
				: '';
		const files = Array.isArray(body.files) ? body.files : [];

		if (files.length > 0) {
			if (files.length > MAX_FILES) {
				throw new Error(`Maximum ${MAX_FILES} files per message`);
			}
			console.log('[teamChatRoutes] sendMessage with files', {
				platform: Platform.OS,
				count: files.length,
				uris: files.map((f) => (f.uri || '').slice(0, 60)),
			});
			// On Android, content:// URIs are not readable by FormData; copy to cache as file://
			let resolvedFiles = files;
			if (Platform.OS === 'android') {
				resolvedFiles = await Promise.all(
					files.map(async (file, index) => {
						const uri = file.uri || '';
						if (!uri.startsWith('content://')) {
							console.log(
								'[teamChatRoutes] Android file not content://, using as-is',
								{ index, uri: uri.slice(0, 60) },
							);
							return file;
						}
						const ext =
							(file.name && file.name.includes('.')
								? file.name.slice(file.name.lastIndexOf('.'))
								: '') || '.bin';
						const cachePath = `${FileSystemLegacy.cacheDirectory}team_chat_upload_${Date.now()}_${index}${ext}`;
						try {
							await FileSystemLegacy.copyAsync({
								from: uri,
								to: cachePath,
							});
							console.log(
								'[teamChatRoutes] Android copied content URI to cache',
								{ index, cachePath: cachePath.slice(0, 70) },
							);
							return {
								...file,
								uri: cachePath,
							};
						} catch (copyErr) {
							console.log(
								'[teamChatRoutes] Android copyAsync failed',
								{
									index,
									message: copyErr?.message,
									uri: uri.slice(0, 50),
								},
							);
							throw copyErr;
						}
					}),
				);
				console.log(
					'[teamChatRoutes] Resolved URIs after copy',
					resolvedFiles.map((f) => (f.uri || '').slice(0, 70)),
				);
			}
			// Multipart: content + files. Backend accepts field name 'files' or 'file'.
			// Do not set Content-Type—apiClient strips it so the runtime adds boundary.
			const form = new FormData();
			form.append('content', content);
			resolvedFiles.forEach((file) => {
				if (file.size != null && file.size > MAX_FILE_BYTES) {
					throw new Error('Each file must be 25 MB or smaller');
				}
				if (file.mimeType && !isAllowedMime(file.mimeType)) {
					throw new Error(`File type not allowed: ${file.mimeType}`);
				}
				// React Native: { uri, name, type } so the file is read and streamed
				const filePayload = {
					uri: file.uri,
					name: file.name || 'file',
					type: file.mimeType || 'application/octet-stream',
				};
				form.append('files', filePayload);
			});
			console.log(
				'[teamChatRoutes] Posting multipart to',
				`/api/teams/${teamId}/messages`,
			);
			try {
				// On Android, axios often fails with ERR_NETWORK when sending FormData with file URIs; fetch works.
				if (Platform.OS === 'android') {
					const token = await SecureStore.getItemAsync('userToken');
					const authHeader = token?.startsWith('Bearer ')
						? token
						: token
							? `Bearer ${token}`
							: '';
					const res = await fetch(
						`${API_BASE_URL}/api/teams/${teamId}/messages`,
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
								`Request failed ${res.status}`,
						);
						err.response = { status: res.status, data };
						throw err;
					}
					console.log(
						'[teamChatRoutes] Post response status (fetch)',
						res.status,
					);
					return data;
				}
				const response = await apiClient.post(
					`/api/teams/${teamId}/messages`,
					form,
				);
				console.log(
					'[teamChatRoutes] Post response status',
					response?.status,
				);
				return response.data;
			} catch (postErr) {
				console.log('[teamChatRoutes] Post failed', {
					message: postErr?.message,
					code: postErr?.code,
					status: postErr?.response?.status,
					data: postErr?.response?.data,
				});
				throw postErr;
			}
		}

		const response = await apiClient.post(`/api/teams/${teamId}/messages`, {
			content,
		});
		return response.data;
	},

	/**
	 * Get a signed URL to download an attachment.
	 * @param {number} teamId
	 * @param {number} messageId
	 * @param {number} attachmentId
	 * @returns {{ url: string }}
	 */
	getAttachmentDownloadUrl: async (teamId, messageId, attachmentId) => {
		const response = await apiClient.get(
			`/api/teams/${teamId}/messages/${messageId}/attachments/${attachmentId}/download`,
		);
		return response.data;
	},

	/**
	 * Add current user's reaction to a message. Idempotent. Returns full message with reactions.
	 * @param {number} teamId
	 * @param {number} messageId
	 * @param {string} type - one of: heart, thumbsup, thumbsdown, laugh, sad, angry
	 * @returns Message object with reactions
	 */
	addReaction: async (teamId, messageId, type) => {
		const response = await apiClient.post(
			`/api/teams/${teamId}/messages/${messageId}/reactions`,
			{ type },
		);
		return response.data;
	},

	/**
	 * Remove current user's reaction of given type. Returns full message with reactions.
	 * @param {number} teamId
	 * @param {number} messageId
	 * @param {string} type - one of: heart, thumbsup, thumbsdown, laugh, sad, angry
	 * @returns Message object with reactions
	 */
	removeReaction: async (teamId, messageId, type) => {
		const response = await apiClient.delete(
			`/api/teams/${teamId}/messages/${messageId}/reactions/${type}`,
		);
		return response.data;
	},

	/**
	 * Delete one message (author or team lead).
	 * @param {number} teamId
	 * @param {number} messageId
	 */
	deleteMessage: async (teamId, messageId) => {
		const response = await apiClient.delete(
			`/api/teams/${teamId}/messages/${messageId}`,
		);
		return response.data;
	},

	/**
	 * Delete entire team chat (team lead or org admin).
	 * @param {number} teamId
	 * @returns {{ message: string, deletedCount?: number }}
	 */
	deleteChat: async (teamId) => {
		const response = await apiClient.delete(`/api/teams/${teamId}/chat`);
		return response.data;
	},

	/**
	 * Mark team chat as read up to a message (call when user has seen latest).
	 * @param {number} teamId
	 * @param {{ lastReadMessageId?: number }} body
	 * @returns {{ lastReadMessageId: number }}
	 */
	markRead: async (teamId, body = {}) => {
		const response = await apiClient.put(`/api/teams/${teamId}/chat/read`, body);
		return response.data;
	},

	/**
	 * Get unread message count for one team.
	 * @param {number} teamId
	 * @returns {{ unreadCount: number }}
	 */
	getUnreadCount: async (teamId) => {
		const response = await apiClient.get(`/api/teams/${teamId}/chat/unread-count`);
		return response.data;
	},

	/**
	 * Get unread counts for all teams (for badges).
	 * @returns {{ unreadCounts: Record<string, number> }} keys are team ids as strings
	 */
	getAllUnreadCounts: async () => {
		const response = await apiClient.get('/api/teams/chat-unread-counts');
		return response.data;
	},
};

export { MAX_CONTENT_LENGTH, MAX_FILES, MAX_FILE_BYTES, isAllowedMime };
