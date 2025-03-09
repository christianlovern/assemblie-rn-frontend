import axios from 'axios';

const url = 'http://192.168.1.129:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
const API_BASE_URL = `${url}api`;

export const mediaApi = {
	// Get all media for an organization
	getAll: async (orgId, folderId = null) => {
		try {
			const queryParams = folderId ? `?folderId=${folderId}` : '';
			const response = await axios.get(
				`${API_BASE_URL}/media/organization/${orgId}${queryParams}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data.media;
		} catch (error) {
			console.error('Failed to fetch media:', error);
			throw error;
		}
	},

	// Get a specific media item
	getOne: async (mediaId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/media/${mediaId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data.media;
		} catch (error) {
			console.error('Failed to fetch media item:', error);
			throw error;
		}
	},

	// Search for media and folders
	search: async (orgId, query) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/media/search/${orgId}?query=${encodeURIComponent(
					query
				)}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
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
