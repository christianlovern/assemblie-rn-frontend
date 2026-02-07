import apiClient from './apiClient';

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
			// Multipart: content + files. Backend accepts field name 'files' or 'file'.
			// Do not set Content-Type—apiClient strips it so the runtime adds boundary.
			const form = new FormData();
			form.append('content', content);
			files.forEach((file) => {
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
			const response = await apiClient.post(
				`/api/teams/${teamId}/messages`,
				form,
			);
			return response.data;
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
};

export { MAX_CONTENT_LENGTH, MAX_FILES, MAX_FILE_BYTES, isAllowedMime };
