import { Platform } from 'react-native';
import axios from 'axios';

// const url =
// 	Platform.OS == 'android'
// 		? 'http://10.0.2.2:8000/'
// 		: 'http://localhost:8000/';

const url = 'http://192.168.1.129:8000/';

export const signInUser = async (data) => {
	console.log('WE ARE TRYING TO SIGN IN', data);
	const headers = {
		'Content-Type': 'application/json',
	};

	const response = await axios
		.post(url + 'api/session/login', data, { headers })
		.catch((error) => {
			console.error('Login failed');
			if (error.response) {
				console.error('Status:', error.response.status);
				console.error('Data:', error.response.data);
			} else if (error.request) {
				console.log(url);
				// The request was made but no response was received
				console.error('No response received:', error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.error('Error:', error.message);
			}
		});
	console.log(response.data);
	return {
		data: response.data,
		status: response.status,
	};
};

export const signInGuest = async (data) => {
	const headers = {
		'Content-Type': 'application/json',
	};

	const response = await axios
		.post(url + 'api/session/guest-login', data, { headers })
		.catch((error) => {
			console.error('Login failed');
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.error('Status:', error.response.status);
				console.error('Data:', error.response.data);
			} else if (error.request) {
				console.log(url);
				// The request was made but no response was received
				console.error('No response received:', error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.error('Error:', error.message);
			}
		});

	return {
		data: response.data,
		status: response.status,
	};
};

export const signUpUser = async (data) => {
	console.log('IN API', data);
	const headers = {
		'Content-Type': 'application/json',
	};

	const response = await axios
		.post(url + 'api/users', data, { headers })
		.catch((error) => {
			console.error('Login failed');
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.error('Status:', error.response.status);
				console.error('Data:', error.response.data);
			} else if (error.request) {
				console.log(url);
				// The request was made but no response was received
				console.error('No response received:', error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.error('Error:', error.message);
			}
		});

	return {
		data: response.data,
		status: response.status,
	};
};

// export const getToken = () => {
//     axios.get('http://localhost:8000/api/csrf/restore').then(response => console.log(response)).catch(error => console.log(error))
// }
