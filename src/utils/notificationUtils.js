import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../../api/apiClient';

// Fallback EAS projectId for bare/Android Studio builds where Constants may not have extra.eas.projectId
const EAS_PROJECT_ID_FALLBACK = 'e9a7b152-ad5c-448a-9e71-7fcb3b2be29d';

function getProjectId() {
	return (
		Constants.expoConfig?.extra?.eas?.projectId ??
		Constants.manifest?.extra?.eas?.projectId ??
		Constants.easConfig?.projectId ??
		EAS_PROJECT_ID_FALLBACK
	);
}

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
		try {
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

			const projectId = getProjectId();
			token = (
				await Notifications.getExpoPushTokenAsync({
					projectId,
				})
			).data;

			// Configure notification channels for Android
			if (Platform.OS === 'android') {
				await Notifications.setNotificationChannelAsync('default', {
					name: 'default',
					importance: Notifications.AndroidImportance.MAX,
					vibrationPattern: [0, 250, 250, 250],
					lightColor: '#FF231F7C',
				});
			}
		} catch (err) {
			return null;
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
			organizationId,
		};

		const response = await apiClient.post(
			'/api/notifications/register-device',
			payload,
		);
		return response.data;
	} catch (error) {
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
	} catch (e) {}
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

		return response.data;
	} catch (error) {
		if (error.response?.status === 404) {
			return;
		}
		throw error;
	}
}

/**
 * Enable or disable push notifications for a single organization.
 * Token stays registered; only that org's flag in organizationPreferences changes.
 * @param {string} token - Expo push token
 * @param {number} organizationId - Organization id
 * @param {boolean} enabled - Whether to receive notifications for this org
 */
export async function patchDevicePreferences(token, organizationId, enabled) {
	const response = await apiClient.patch(
		'/api/notifications/device-preferences',
		{ token, organizationId, enabled },
	);
	return response.data;
}
