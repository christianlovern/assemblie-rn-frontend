import apiClient from './apiClient';

export const staffApi = {
	/**
	 * List all staff for an organization.
	 * Filter by featuredStaff === true for "Featured staff" / "Meet the staff" section.
	 */
	getAll: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/organizations/${orgId}/staff`,
			);
			const data = response.data;
			if (Array.isArray(data)) return data;
			return data?.staff ?? [];
		} catch (error) {
			console.error('Failed to fetch staff:', error);
			throw error;
		}
	},
};
