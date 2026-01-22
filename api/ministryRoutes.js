import apiClient from './apiClient';

export const ministryApi = {
	getAllForOrganization: async (organizationId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/organization/${organizationId}`
			);
			console.log('response.data.ministries', response.data.ministries);
			return response.data.ministries;
		} catch (error) {
			console.error('Failed to fetch ministries:', error);
			throw error;
		}
	},

	getMinistry: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}`
			);
			return response.data.ministry;
		} catch (error) {
			console.error('Failed to fetch ministry:', error);
			throw error;
		}
	},

	getCheckIns: async (ministryId) => {
		try {
			const response = await apiClient.get(
				`/api/ministries/${ministryId}/checkins`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch ministry check-ins:', error);
			throw error;
		}
	},
};
