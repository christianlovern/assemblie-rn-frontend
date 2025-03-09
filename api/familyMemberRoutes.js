import axios from 'axios';

const url = 'http://192.168.1.129:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
const API_BASE_URL = `${url}api`;

export const familyMembersApi = {
	// Get all family members
	getAll: async () => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/users/family-members`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true, // Add this to send cookies
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch family members:', error);
			throw error;
		}
	},

	// Add new family member
	create: async (familyMemberData) => {
		try {
			const response = await axios.post(
				`${API_BASE_URL}/users/family-members`,
				familyMemberData,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true, // Add this to send cookies
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to create family member:', error);
			throw error;
		}
	},

	// Update family member
	update: async (familyMemberId, updateData) => {
		try {
			const response = await axios.put(
				`${API_BASE_URL}/users/family-members/${familyMemberId}`,
				updateData,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true, // Add this to send cookies
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to update family member:', error);
			throw error;
		}
	},

	// Delete family member
	delete: async (familyMemberId) => {
		try {
			const response = await axios.delete(
				`${API_BASE_URL}/users/family-members/${familyMemberId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true, // Add this to send cookies
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to delete family member:', error);
			throw error;
		}
	},
};
