import apiClient from './apiClient';

export const uploadApi = {
	uploadUserAvatar: async (orgId, userId, file) => {
		try {
			const formData = new FormData();
			const extension = file.uri.split('.').pop();

			formData.append('file', {
				uri: file.uri,
				type: 'image/jpeg',
				name: `photo.${extension}`,
			});

			const response = await apiClient.post(
				`/api/uploads/${orgId}/avatars/${userId}`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (!response.data.fileUrl) {
				throw new Error('No file URL received from server');
			}

			return response.data.fileUrl;
		} catch (error) {
			console.error('Failed to upload avatar:', error);
			const errorMessage = error.response?.data?.message || error.message;
			throw new Error(`Failed to upload avatar: ${errorMessage}`);
		}
	},

	uploadAvatar: async (orgId, familyMemberId, file, newMember) => {
		try {
			console.log('Starting avatar upload with:', {
				orgId,
				familyMemberId,
				file,
			});

			const formData = new FormData();
			const extension = file.uri.split('.').pop();
			console.log('File extension:', extension);

			formData.append('file', {
				uri: file.uri,
				type: 'image/jpeg',
				name: `${newMember.firstName}_${newMember.lastName}_avatar.${extension}`,
			});

			console.log(
				'Making request to:',
				`/api/uploads/${orgId}/family-members/avatar/${familyMemberId}`
			);

			const response = await apiClient.post(
				`/api/uploads/${orgId}/family-members/avatar/${familyMemberId}`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			console.log('Upload response:', response.data);

			if (!response.data.fileUrl) {
				throw new Error('No file URL received from server');
			}

			return response.data.fileUrl;
		} catch (error) {
			console.error('Failed to upload avatar:', error);
			console.error('Full error:', JSON.stringify(error, null, 2));
			const errorMessage = error.response?.data?.message || error.message;
			throw new Error(`Failed to upload avatar: ${errorMessage}`);
		}
	},
};
