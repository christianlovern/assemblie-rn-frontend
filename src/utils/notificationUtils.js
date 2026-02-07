import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../../api/apiClient';

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

		// Respect the user's choice: do not prompt again if they have already denied
		if (existingStatus === 'denied') {
			return null;
		}

		let finalStatus = existingStatus;
		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		// User declined or permission not granted — return without nagging
		if (finalStatus !== 'granted') {
			return null;
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

export const sendPushTokenToBackend = async (token, userId, organizationId) => {
	try {
		const payload = {
			token,
			deviceType: 'expo',
			organizationId, // Make sure this is included
		};
		console.log('Sending notification payload:', payload);

		const response = await apiClient.post(
			'/api/notifications/register-device',
			payload,
		);
		return response.data;
	} catch (error) {
		console.error('Error saving push token:', error);
		console.error('Error response data:', error.response?.data);
		console.error('Error status:', error.response?.status);
		console.error('Full error response:', error.response);
		throw error;
	}
};

/**
 * Clear the app icon badge (red alert count). Call when the user opens the app
 * (e.g. on app focus) or taps a notification so the badge is removed.
 */
export async function clearAppIconBadge() {
	try {
		await Notifications.setBadgeCountAsync(0);
	} catch (e) {
		console.warn('Could not clear app icon badge:', e);
	}
}

export async function unregisterPushTokenFromBackend(token) {
	try {
		const response = await apiClient.delete(
			'/api/notifications/unregister-device',
			{
				data: { token },
			},
		);

		if (!response.data) {
			throw new Error('Failed to unregister device');
		}

		console.log('Device unregistration successful:', response.data);
		return response.data;
	} catch (error) {
		console.error('Error removing push token:', error);
		if (error.response) {
			console.error('Error response data:', error.response.data);
		}
		throw error;
	}
}
