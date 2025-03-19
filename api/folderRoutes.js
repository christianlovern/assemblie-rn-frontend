import axios from 'axios';

// const url = 'https://7d86-192-230-190-82.ngrok-free.app/'; //home
const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
// const url = 'http://localhost:8000/';
// const url = 'https://34ae-192-230-190-82.ngrok-free.app/';

const API_BASE_URL = `${url}api`;

export const foldersApi = {
	// Get all folders for an organization
	getAll: async (orgId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/folders/organization/${orgId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
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
			const response = await axios.get(
				`${API_BASE_URL}/folders/${folderId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data.folder;
		} catch (error) {
			console.error('Failed to fetch folder:', error);
			throw error;
		}
	},
};
