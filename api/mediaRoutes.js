import apiClient from './apiClient';

export const mediaApi = {
	// Get all media for an organization
	getAll: async (orgId, folderId = null) => {
		try {
			const response = await apiClient.get(
				`/api/media/organization/${orgId}`,
				{
					params: folderId ? { folderId } : undefined,
				},
			);
			return response.data.media;
		} catch (error) {
			console.error('Failed to fetch media:', error);
			throw error;
		}
	},

	getFeatured: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/media/organization/${orgId}/featured`,
			);
			return response.data.media;
		} catch (error) {
			console.error('Failed to fetch featured media:', error);
			throw error;
		}
	},

	// Get a specific media item
	getOne: async (mediaId) => {
		try {
			const response = await apiClient.get(`/api/media/${mediaId}`);
			return response.data.media;
		} catch (error) {
			console.error('Failed to fetch media item:', error);
			throw error;
		}
	},

	// Search for media and folders
	search: async (orgId, query) => {
		try {
			const response = await apiClient.get(`/api/media/search/${orgId}`, {
				params: { query },
			});
			return {
				fileResults: response.data.fileResults,
				folderResults: response.data.folderResults,
			};
		} catch (error) {
			console.error('Failed to search media and folders:', error);
			throw error;
		}
	},

	/**
	 * Upload a blob as base64 or data URL to POST /media. Backend creates the file and media in one step.
	 * @param {number} organizationId
	 * @param {{ name: string, fileType: string, data: string, filename?: string, mimetype?: string }} opts
	 * @returns {Promise<{ fileUrl: string }>} response with fileUrl (and possibly media record)
	 */
	uploadBlob: async (organizationId, opts) => {
		const { name, fileType, data, filename, mimetype } = opts;
		if (!organizationId || !name || !fileType || data == null) {
			throw new Error('organizationId, name, fileType, and data are required');
		}
		const body = {
			name,
			fileType,
			organizationId,
			data,
		};
		if (filename != null) body.filename = filename;
		if (mimetype != null) body.mimetype = mimetype;
		const response = await apiClient.post('/api/media', body);
		const fileUrl =
			response.data?.fileUrl ?? response.data?.media?.fileUrl;
		if (!fileUrl) throw new Error('No file URL received from server');
		return { fileUrl, media: response.data?.media };
	},
};
