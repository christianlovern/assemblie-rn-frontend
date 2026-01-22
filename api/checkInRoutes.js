import apiClient from './apiClient';

export const checkInsApi = {
	// Get all check-ins for a ministry
	getAll: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch check-ins:', error);
			throw error;
		}
	},

	// Check in users and family members
	checkIn: async (ministryId, userIds, familyMemberIds) => {
		try {
			const response = await apiClient.post(
				`/api/ministries/${ministryId}/checkin`,
				{
					userIds,
					familyMemberIds,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to check in:', error);
			throw error;
		}
	},

	// Check out users and family members
	checkOut: async (ministryId, userIds, familyMemberIds) => {
		try {
			const response = await apiClient.patch(
				`/api/ministries/${ministryId}/checkout`,
				{
					userIds,
					familyMemberIds,
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
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins/status`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to get check-in status:', error);
			throw error;
		}
	},

	// Get all check-ins for a ministry
	getAllForMinistry: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins/all`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch all check-ins:', error);
			throw error;
		}
	},
};
