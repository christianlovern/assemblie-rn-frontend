import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Switch,
	Linking,
	Alert,
	StyleSheet,
	ScrollView,
} from 'react-native';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightenColor } from '../../../shared/helper/colorFixer';
import Background from '../../../shared/components/Background';
import { usersApi } from '../../../api/userRoutes';
import { typography } from '../../../shared/styles/typography';
import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
	unregisterPushTokenFromBackend,
} from '../../utils/notificationUtils';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

// Section Component - matches home screen header style
const Section = ({ title, children, primaryColor }) => (
	<View style={styles.section}>
		<Text
			style={[
				styles.sectionTitle,
				{
					color: lightenColor(primaryColor),
				},
			]}>
			{title}
		</Text>
		<View style={styles.sectionContent}>{children}</View>
	</View>
);

const SettingsScreen = () => {
	const { user, organization, setUser, setAuth } = useData();

	if (!user || !organization) {
        return null; 
    }
	const { colors, colorMode } = useTheme();
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);
	const [pushToken, setPushToken] = useState(null);
	const navigation = useNavigation();

	// Add useEffect to check current notification status
	useEffect(() => {
		checkNotificationStatus();
	}, []);

	const checkNotificationStatus = async () => {
		try {
			const { status } = await Notifications.getPermissionsAsync();
			setNotificationsEnabled(status === 'granted');
			if (status === 'granted') {
				const token = await registerForPushNotificationsAsync();
				setPushToken(token);
			}
		} catch (error) {
			console.error('Error checking notification status:', error);
		}
	};

	const handleNotificationToggle = async (value) => {
		try {
			if (value) {
				// Enable notifications
				const token = await registerForPushNotificationsAsync();
				if (token) {
					await sendPushTokenToBackend(
						token,
						user.id,
						organization.id
					);
					setPushToken(token);
					setNotificationsEnabled(true);
				}
			} else {
				// Disable notifications
				if (pushToken) {
					await unregisterPushTokenFromBackend(pushToken);
					setPushToken(null);
				}
				setNotificationsEnabled(false);
			}
		} catch (error) {
			Alert.alert(
				'Error',
				'Failed to update notification settings. Please try again.'
			);
			// Revert the switch to previous state
			setNotificationsEnabled(!value);
		}
	};

	const handlePasswordChange = () => {
		navigation.navigate('ChangePassword');
	};

	const handleLeaveOrganization = async () => {
		try {
			await usersApi.leaveOrganization(organization.id, user.id);
			// If successful, clear user data and log out
			setUser({});
			setAuth(false);
		} catch (error) {
			Alert.alert(
				'Error',
				error.response?.data?.message || 'Failed to leave organization'
			);
		}
	};

	const handleFAQ = () => {
		console.log('Opening FAQ page');
	};

	const handleReportIssue = () => {
		navigation.navigate('ReportIssue');
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<ScrollView style={styles.scrollContainer}>
				<View style={styles.container}>
					<Section
						title='Notifications'
						primaryColor={organization.primaryColor}>
						<View
							style={[
								styles.settingRow,
								{
									backgroundColor:
										colorMode === 'dark'
											? 'rgba(255, 255, 255, 0.1)'
											: 'rgba(0, 0, 0, 0.05)',
								},
							]}>
							<Text style={[styles.settingText, { color: colors.text }]}>
								Allow Notifications
							</Text>
							<Switch
								value={notificationsEnabled}
								onValueChange={handleNotificationToggle}
								trackColor={{
									false: colorMode === 'dark' ? '#767577' : '#ccc',
									true: organization.primaryColor,
								}}
								thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
							/>
						</View>
					</Section>

					<Section
						title='Security'
						primaryColor={organization.primaryColor}>
						<TouchableOpacity
							style={[
								styles.settingButton,
								{
									backgroundColor:
										colorMode === 'dark'
											? 'rgba(255, 255, 255, 0.1)'
											: 'rgba(0, 0, 0, 0.05)',
								},
							]}
							onPress={handlePasswordChange}>
							<Text style={[styles.buttonText, { color: colors.text }]}>
								Change Password
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.settingButton, styles.dangerButton]}
							onPress={handleLeaveOrganization}>
							<Text style={styles.dangerText}>
								Leave Organization
							</Text>
						</TouchableOpacity>
					</Section>

					<Section
						title='Help'
						primaryColor={organization.primaryColor}>
						<TouchableOpacity
							style={[
								styles.settingButton,
								{
									backgroundColor:
										colorMode === 'dark'
											? 'rgba(255, 255, 255, 0.1)'
											: 'rgba(0, 0, 0, 0.05)',
								},
							]}
							onPress={handleReportIssue}>
							<Text style={[styles.buttonText, { color: colors.text }]}>
								Report an Issue
							</Text>
						</TouchableOpacity>
					</Section>
				</View>
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	scrollContainer: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 40,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		...typography.h2,
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 12,
		paddingHorizontal: 0,
	},
	sectionContent: {
		paddingHorizontal: 0,
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
	},
	settingText: {
		...typography.body,
		flex: 1,
		fontSize: 16,
	},
	settingButton: {
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
	},
	buttonText: {
		...typography.body,
		fontSize: 16,
		textAlign: 'center',
	},
	dangerButton: {
		backgroundColor: '#FF3B30',
	},
	dangerText: {
		...typography.body,
		fontSize: 16,
		color: 'white',
		textAlign: 'center',
	},
});

export default SettingsScreen;
