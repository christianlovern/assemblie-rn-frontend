import apiClient from './apiClient';

/**
 * Contact form API (public endpoints).
 * GET /api/contact/topics – dropdown options for Contact Us.
 * POST /api/contact – submit contact form (optional topicId + organizationId).
 */

export const contactApi = {
	/**
	 * Get contact topics for the organization (for dropdown).
	 * @param {number} organizationId
	 * @returns {Promise<{ topics: Array<{ id: number, label: string, sortOrder: number }> }>}
	 */
	getTopics: async (organizationId) => {
		if (!organizationId) {
			throw new Error('organizationId is required');
		}
		const response = await apiClient.get('/api/contact/topics', {
			params: { organizationId },
		});
		return response.data;
	},

	/**
	 * Submit the contact form.
	 * @param {{ name: string, email: string, message: string, topicId?: number, organizationId?: number }} payload
	 * @returns {Promise<{ message: string, template?: string }>}
	 */
	submit: async (payload) => {
		const { name, email, message, topicId, organizationId } = payload;
		if (!name?.trim() || !email?.trim() || !message?.trim()) {
			throw new Error('Name, email, and message are required.');
		}
		const body = {
			name: String(name).trim(),
			email: String(email).trim(),
			message: String(message).trim(),
		};
		if (topicId != null && organizationId != null) {
			body.topicId = Number(topicId);
			body.organizationId = Number(organizationId);
		}
		const response = await apiClient.post('/api/contact', body);
		return response.data;
	},
};
