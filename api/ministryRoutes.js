import axios from 'axios';

const url = 'http://192.168.1.129:8000/';
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
const API_BASE_URL = `${url}api`;

export const ministryApi = {
	getAllForOrganization: async (organizationId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/ministries/organization/${organizationId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data.ministries;
		} catch (error) {
			console.error('Failed to fetch ministries:', error);
			throw error;
		}
	},

	getMinistry: async (ministryId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/ministries/${ministryId}`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data.ministry;
		} catch (error) {
			console.error('Failed to fetch ministry:', error);
			throw error;
		}
	},
};
