import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

// const url = 'https://7d86-192-230-190-82.ngrok-free.app/'; //home
const url = 'http://192.168.1.129:8000/'; //home
// const url = 'http://192.168.1.140:8000/'; // church
// const url = 'http://10.136.164.61:8000/'; //TWB
// const url = 'http://localhost:8000/';

const API_BASE_URL = `${url}api`;

// Create an axios instance with the base configuration
const axiosInstance = axios.create({
	baseURL: url,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
});

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

export async function registerForPushNotificationsAsync() {
	let token;

	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== 'granted') {
			alert('Failed to get push token for push notification!');
			return;
		}

		token = (
			await Notifications.getExpoPushTokenAsync({
				projectId: Constants.expoConfig.extra.eas.projectId, // Gets project ID from app.config.js
			})
		).data;

		// Configure notification channels for Android
		if (Platform.OS === 'android') {
			Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: '#FF231F7C',
			});
		}
	} else {
		alert('Must use physical device for Push Notifications');
	}

	return token;
}

export async function sendPushTokenToBackend(token, organizationId) {
	try {
		const payload = {
			token: token,
			deviceType: 'expo',
			organizationId: organizationId, // Add organization ID to payload
		};

		console.log(
			'Sending notification payload:',
			JSON.stringify(payload, null, 2)
		);

		const response = await axiosInstance.post(
			'api/notifications/register-device',
			payload,
			{
				headers: {
					'Content-Type': 'application/json',
				},
				withCredentials: true,
			}
		);

		if (!response.data) {
			throw new Error('Failed to register device');
		}

		console.log('Device registration successful:', response.data);
		return response.data;
	} catch (error) {
		console.error('Error saving push token:', error);
		if (error.response) {
			console.error('Error response data:', error.response.data);
			console.error('Error status:', error.response.status);
			console.error('Full error response:', error.response);
		}
		throw error;
	}
}
