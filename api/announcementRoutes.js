import axios from 'axios';
import { Platform } from 'react-native';

const url = 'http://192.168.1.129:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
const API_BASE_URL = `${url}api`;

export const announcementsApi = {
	getAll: async (orgId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/organizations/${orgId}/announcements`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
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
			const response = await axios.get(
				`${API_BASE_URL}/organizations/${orgId}/events`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch events:', error);
			throw error;
		}
	},

	getOne: async (id) => {
		try {
			const response = await axios.get(`${API_BASE_URL}/events/${id}`, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
			return response.data;
		} catch (error) {
			console.error('Failed to fetch event:', error);
			throw error;
		}
	},

	create: async (eventData) => {
		try {
			const response = await axios.post(
				`${API_BASE_URL}/events`,
				eventData,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
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
			const response = await axios.patch(
				`${API_BASE_URL}/events/${eventId}`,
				data,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
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
			const response = await axios.delete(
				`${API_BASE_URL}/events/${id}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
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
			const response = await axios.post(
				`${API_BASE_URL}/events/${eventId}/rsvp`,
				{},
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
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
