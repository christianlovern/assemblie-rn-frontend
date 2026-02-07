import apiClient from './apiClient';

export const checkInsApi = {
	// Get all check-ins for a ministry
	getAll: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins`,
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
				},
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
				},
			);
			return response.data;
		} catch (error) {
			console.error('Failed to check out:', error);
			throw error;
		}
	},

	// Get check-in status (current user's status for this ministry; includes checkoutToken when applicable)
	getStatus: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins/status`,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to get check-in status:', error);
			throw error;
		}
	},

	// Spec endpoint: current user's check-in status (for guardian "Show pickup QR")
	getCheckInStatus: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkin-status`,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to get check-in status:', error);
			throw error;
		}
	},

	// QR checkout: verify token from guardian's QR (staff/org admin only)
	verifyCheckoutQr: async (ministryId, checkoutToken) => {
		try {
			const response = await apiClient.post(
				`/api/ministries/${ministryId}/checkout/verify-qr`,
				{ checkoutToken: String(checkoutToken).trim() },
			);
			return response.data;
		} catch (error) {
			if (error.response?.data?.message) {
				throw Object.assign(error, {
					userMessage: error.response.data.message,
				});
			}
			throw error;
		}
	},

	// Get all check-ins for a ministry. Team/staff: use response.data.checkIns as before.
	// "My party" pickup QR: entries in checkIns[].users and checkIns[].familyMembers that have
	// a checkoutToken are the current user and their linked family; use that token per entry for QR.
	getAllForMinistry: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins/all`,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch all check-ins:', error);
			throw error;
		}
	},
};
