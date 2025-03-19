import axios from 'axios';

// const url = 'https://7d86-192-230-190-82.ngrok-free.app/'; //home
const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.1.142:8000/';
// const url = 'http://192.168.229.62:8000/';
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
// const url = 'http://localhost:8000/';
// const url = 'https://34ae-192-230-190-82.ngrok-free.app/';

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
			console.log('response.data.ministries', response.data.ministries);
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

	getCheckIns: async (ministryId) => {
		try {
			const response = await axios.get(
				`${API_BASE_URL}/ministries/${ministryId}/checkins`,
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			return response.data;
		} catch (error) {
			console.error('Failed to fetch ministry check-ins:', error);
			throw error;
		}
	},
};
