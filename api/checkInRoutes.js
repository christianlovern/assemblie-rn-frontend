import axios from 'axios';

const url = 'http://192.168.1.129:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
const API_BASE_URL = `${url}api`;

export const checkInsApi = {
	// Get all check-ins for a ministry
	getAll: async (ministryId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/ministries/${ministryId}/checkins`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch check-ins:', error);
			throw error;
		}
	},

	// Check in users and family members
	checkIn: async (ministryId, userIds, familyMemberIds) => {
		console.log('userIds', userIds);
		console.log('familyMemberIds', familyMemberIds);
		console.log('ministryId', ministryId);
		try {
			const response = await axios.post(
				`${API_BASE_URL}/ministries/${ministryId}/checkin`,
				{
					userIds: userIds,
					familyMemberIds: familyMemberIds,
				},
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			console.log('response', response);
			return response.data;
		} catch (error) {
			console.error('Failed to check in:', error);
			throw error;
		}
	},

	// Check out users and family members
	checkOut: async (ministryId, userIds, familyMemberIds) => {
		try {
			const response = await axios.patch(
				`${API_BASE_URL}/ministries/${ministryId}/checkout`,
				{
					userIds: userIds,
					familyMemberIds: familyMemberIds,
				},
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to check out:', error);
			throw error;
		}
	},

	// Get check-in status
	getStatus: async (ministryId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/ministries/${ministryId}/checkins/status`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to get check-in status:', error);
			throw error;
		}
	},

	// Add new method to get all check-ins for a ministry
	getAllForMinistry: async (ministryId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/ministries/${ministryId}/checkins/all`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch all check-ins:', error);
			throw error;
		}
	},
};
