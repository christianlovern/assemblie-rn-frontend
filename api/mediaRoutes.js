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
};
