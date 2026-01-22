import apiClient from './apiClient';

export const familyMembersApi = {
	// Get all family members for the current user
	getAll: async () => {
		try {
			const response = await apiClient.get('/api/users/family-members');
			return response.data;
		} catch (error) {
			console.error('Failed to fetch family members:', error);
			throw error;
		}
	},

	// Add a new family member
	create: async (familyMemberData) => {
		try {
			const response = await apiClient.post(
				'/api/users/family-members',
				familyMemberData,
				{
					timeout: 30000, // Maintain increased timeout for large images
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to create family member:', error);
			throw error;
		}
	},

	// Update a family member
	update: async (familyMemberId, updateData) => {
		try {
			const response = await apiClient.put(
				`/api/users/family-members/${familyMemberId}`,
				updateData
			);
			return response.data;
		} catch (error) {
			console.error('Failed to update family member:', error);
			throw error;
		}
	},

	// Delete a family member
	delete: async (familyMemberId) => {
		try {
			const response = await apiClient.delete(
				`/api/users/family-members/${familyMemberId}`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to delete family member:', error);
			throw error;
		}
	},

	// Connect with another user as family
	connect: async (connectionUserId) => {
		try {
			const response = await apiClient.post(
				'/api/users/family-members/connect',
				{ connectionUserId }
			);
			return response.data;
		} catch (error) {
			console.error('Failed to create family connection:', error);
			if (error.response?.data?.message === 'Connected already exists') {
				throw new Error('You are already connected with this user');
			}
			throw error;
		}
	},

	// Accept or reject a family connection request
	respondToConnection: async (senderId, accept) => {
		try {
			const response = await apiClient.put(
				'/api/users/family-members/connect',
				{ senderId, accept }
			);
			return response.data;
		} catch (error) {
			console.error('Failed to respond to connection request:', error);
			throw error;
		}
	},

	// Cancel a connection request
	cancelConnectionRequest: async (receiverId) => {
		try {
			const response = await apiClient.delete(
				`/api/users/family-members/connect/${receiverId}`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to cancel connection request:', error);
			throw error;
		}
	},

	// Search users by name
	searchByName: async (query) => {
		try {
			const response = await apiClient.get('/api/users/search/name', {
				params: { query },
			});
			return response.data;
		} catch (error) {
			console.error('Failed to search users:', error);
			throw error;
		}
	},

	// Accept a connection
	acceptConnection: async (memberId) => {
		try {
			const response = await apiClient.post(
				`/api/family-members/accept/${memberId}`
			);
			return response.data;
		} catch (error) {
			console.error('Error accepting connection:', error);
			throw error.response?.data || error;
		}
	},

	// Reject a connection
	rejectConnection: async (memberId) => {
		try {
			const response = await apiClient.post(
				`/api/family-members/reject/${memberId}`
			);
			return response.data;
		} catch (error) {
			console.error('Error rejecting connection:', error);
			throw error.response?.data || error;
		}
	},
};
