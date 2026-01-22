import apiClient from './apiClient';

export const announcementsApi = {
	getAll: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/organizations/${orgId}/announcements`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch announcements:', error);
			if (error.response) {
				console.error('Error response:', error.response.data);
				console.error('Error status:', error.response.status);
			}
			throw error;
		}
	},
};

export const eventsApi = {
	getAll: async (orgId) => {
		try {
			const response = await apiClient.get(
				`/api/organizations/${orgId}/events`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch events:', error);
			throw error;
		}
	},

	getOne: async (id) => {
		try {
			const response = await apiClient.get(`/api/events/${id}`);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch event:', error);
			throw error;
		}
	},

	create: async (eventData) => {
		try {
			const response = await apiClient.post('/api/events', eventData);
			return response.data;
		} catch (error) {
			console.error('Failed to create event:', error);
			throw new Error(
				error.response?.data?.message || 'Failed to create event'
			);
		}
	},

	update: async (eventId, data) => {
		try {
			const response = await apiClient.patch(
				`/api/events/${eventId}`,
				data
			);
			return response.data;
		} catch (error) {
			console.error('Failed to update event:', error);
			throw new Error(
				error.response?.data?.message || 'Failed to update event'
			);
		}
	},

	delete: async (id) => {
		try {
			const response = await apiClient.delete(`/api/events/${id}`);
			return response.data;
		} catch (error) {
			console.error('Failed to delete event:', error);
			throw new Error(
				error.response?.data?.message || 'Failed to delete event'
			);
		}
	},

	rsvp: async (eventId) => {
		try {
			const response = await apiClient.post(
				`/api/events/${eventId}/rsvp`
			);
			return response.data;
		} catch (error) {
			console.error('Failed to RSVP to event:', error);
			throw new Error(
				error.response?.data?.message || 'Failed to RSVP to event'
			);
		}
	},
};
