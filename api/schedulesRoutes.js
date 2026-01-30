import apiClient from './apiClient';

export const schedulesApi = {
	// Get my schedules with optional filters
	getMySchedules: async (filters = {}) => {
		try {
			const params = new URLSearchParams();
			Object.keys(filters).forEach((key) => {
				if (filters[key] != null && filters[key] !== '') {
					params.append(key, filters[key]);
				}
			});
			const queryString = params.toString();
			const url = `/api/schedules/my-schedules${queryString ? `?${queryString}` : ''}`;
			const response = await apiClient.get(url);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch my schedules:', error);
			throw error;
		}
	},

	// Accept a schedule request
	accept: async (scheduleId) => {
		try {
			const response = await apiClient.patch(
				`/api/schedules/${scheduleId}/accept`,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to accept schedule:', error);
			throw error;
		}
	},

	// Decline a schedule request
	decline: async (scheduleId, declineReason = '') => {
		try {
			const response = await apiClient.patch(
				`/api/schedules/${scheduleId}/decline`,
				{ declineReason },
			);
			return response.data;
		} catch (error) {
			console.error('Failed to decline schedule:', error);
			throw error;
		}
	},

	// Request a swap for a schedule
	requestSwap: async (scheduleId, reason = '') => {
		try {
			const response = await apiClient.post(
				`/api/schedules/${scheduleId}/swap`,
				{ reason },
			);
			return response.data;
		} catch (error) {
			console.error('Failed to request swap:', error);
			throw error;
		}
	},

	// Get team swap requests
	getTeamSwapRequests: async (teamId, status = null) => {
		try {
			const url = `/api/schedules/swap/team/${teamId}${status ? `?status=${status}` : ''}`;
			const response = await apiClient.get(url);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch team swap requests:', error);
			throw error;
		}
	},

	// Accept a swap request (take shift)
	acceptSwap: async (swapId) => {
		try {
			const response = await apiClient.patch(
				`/api/schedules/swap/${swapId}/accept`,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to accept swap:', error);
			throw error;
		}
	},

	// Block unavailable dates
	blockDates: async (data) => {
		console.log('Blocking dates:', data);
		try {
			const response = await apiClient.post(
				'/api/schedules/unavailable',
				data,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to block dates:', error);
			throw error;
		}
	},

	// Get my unavailable dates
	getMyUnavailableDates: async (filters = {}) => {
		try {
			const params = new URLSearchParams();
			Object.keys(filters).forEach((key) => {
				if (filters[key] != null && filters[key] !== '') {
					params.append(key, filters[key]);
				}
			});
			const queryString = params.toString();
			const url = `/api/schedules/unavailable${queryString ? `?${queryString}` : ''}`;
			const response = await apiClient.get(url);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch unavailable dates:', error);
			throw error;
		}
	},

	// Remove unavailable date
	removeUnavailableDate: async (id) => {
		try {
			const response = await apiClient.delete(
				`/api/schedules/unavailable/${id}`,
			);
			return response.data;
		} catch (error) {
			console.error('Failed to remove unavailable date:', error);
			throw error;
		}
	},
};
