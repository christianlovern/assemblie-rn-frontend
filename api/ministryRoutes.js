import apiClient from './apiClient';

export const ministryApi = {
	getAllForOrganization: async (organizationId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/organization/${organizationId}`,
			);
			return response.data.ministries;
		} catch (error) {
			throw error;
		}
	},

	getMinistry: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}`,
			);
			return response.data.ministry;
		} catch (error) {
			throw error;
		}
	},

	getCheckIns: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins`,
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	},
};
