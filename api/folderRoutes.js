import apiClient from './apiClient';

export const foldersApi = {
	// Get all folders for an organization
	getAll: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/folders/organization/${orgId}`
			);
			return response.data.folders;
		} catch (error) {
			console.error('Failed to fetch folders:', error);
			throw error;
		}
	},

	// Get a specific folder
	getOne: async (folderId) => {
		try {
			const response = await apiClient.get(`/api/folders/${folderId}`);
			return response.data.folder;
		} catch (error) {
			console.error('Failed to fetch folder:', error);
			throw error;
		}
	},
};
