import axios from 'axios';

// const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://10.136.164.61:8000/'; //TWB
// const url = 'http://localhost:8000/';
const url = 'https://e78b-192-230-190-82.ngrok-free.app/';

const API_BASE_URL = `${url}api`;

export const uploadApi = {
	uploadUserAvatar: async (orgId, userId, file) => {
		try {
			const formData = new FormData();

			// Get the file extension from the URI
			const extension = file.uri.split('.').pop();

			formData.append('file', {
				uri: file.uri,
				type: 'image/jpeg',
				name: `photo.${extension}`, // Pass the original extension
			});

			const response = await axios.post(
				`${API_BASE_URL}/uploads/${orgId}/avatars/${userId}`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					withCredentials: true,
				}
			);

			if (!response.data.fileUrl) {
				throw new Error('No file URL received from server');
			}

			return response.data.fileUrl;
		} catch (error) {
			console.error('Failed to upload avatar:', error);
			// Include the server's error message if available
			const errorMessage = error.response?.data?.message || error.message;
			throw new Error(`Failed to upload avatar: ${errorMessage}`);
		}
	},
};
