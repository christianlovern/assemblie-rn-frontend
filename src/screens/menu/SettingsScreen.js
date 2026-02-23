import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Switch,
	Linking,
	Alert,
	StyleSheet,
	ScrollView,
	Platform,
	Modal,
	TextInput,
	ActivityIndicator,
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
	patchDevicePreferences,
} from '../../utils/notificationUtils';
import * as Notifications from 'expo-notifications';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
	const {
		user,
		organization,
		setAuth,
		clearUserAndToken,
		setOrganization,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setTeams,
	} = useData();

	if (!user || !organization) {
		return null;
	}
	const { colors, colorMode, updateTheme } = useTheme();
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);
	const [pushToken, setPushToken] = useState(null);
	const [organizations, setOrganizations] = useState([]);
	const [orgNotificationPrefs, setOrgNotificationPrefs] = useState({});
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [deletePassword, setDeletePassword] = useState('');
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteError, setDeleteError] = useState('');
	const navigation = useNavigation();

	const checkNotificationStatus = useCallback(async () => {
		try {
			const { status } = await Notifications.getPermissionsAsync();
			setNotificationsEnabled(status === 'granted');
			if (status === 'granted') {
				const token = await registerForPushNotificationsAsync();
				setPushToken(token);
				// When user enabled in system settings and returned, register token with backend so push works
				if (token && user?.id && organization?.id) {
					try {
						await sendPushTokenToBackend(
							token,
							user.id,
							organization.id,
						);
					} catch (e) {
						console.warn(
							'Could not register push token with backend:',
							e,
						);
					}
				}
			} else {
				setPushToken(null);
			}
		} catch (error) {
			// Avoid crashing on Android when permission APIs behave differently (e.g. some OEMs)
			console.warn('Error checking notification status:', error?.message || error);
		}
	}, [user?.id, organization?.id]);

	// Fetch user's organizations for per-org notification toggles
	const fetchOrganizations = useCallback(async () => {
		if (!user?.id) return;
		try {
			if (user.isGuest) {
				setOrganizations(organization ? [organization] : []);
				if (organization?.id) {
					setOrgNotificationPrefs((prev) => ({
						...prev,
						[organization.id]: true,
					}));
				}
				return;
			}
			const response = await usersApi.getMemberships();
			const orgs = response?.organizations || [];
			setOrganizations(orgs);
			setOrgNotificationPrefs((prev) => {
				const next = { ...prev };
				orgs.forEach((org) => {
					if (next[org.id] === undefined) next[org.id] = true;
				});
				return next;
			});
		} catch (e) {
			console.warn('Failed to fetch organizations for notification settings:', e?.message || e);
		}
	}, [user?.id, user?.isGuest, organization]);

	// Check on mount and whenever screen comes back into focus (e.g. from app settings)
	useEffect(() => {
		checkNotificationStatus();
	}, [checkNotificationStatus]);

	useFocusEffect(
		useCallback(() => {
			checkNotificationStatus();
			fetchOrganizations();
		}, [checkNotificationStatus, fetchOrganizations]),
	);

	const handleNotificationToggle = async (value) => {
		try {
			if (value) {
				// Enable notifications: this will show the system permission dialog if not yet decided
				const token = await registerForPushNotificationsAsync();
				if (token) {
					await sendPushTokenToBackend(
						token,
						user.id,
						organization.id,
					);
					setPushToken(token);
					setNotificationsEnabled(true);
				} else {
					// No token: likely denied or not granted. Check and guide user to app settings.
					const { status } =
						await Notifications.getPermissionsAsync();
					if (status === 'denied') {
						Alert.alert(
							'Notifications disabled',
							'Notifications were turned off for this app. To receive alerts, turn them on in your device settings.',
							[
								{ text: 'Cancel', style: 'cancel' },
								{
									text: 'Open Settings',
									onPress: () => Linking.openSettings(),
								},
							],
						);
					}
					// Keep switch off until they grant permission (re-check on focus will update it)
					setNotificationsEnabled(false);
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
			console.warn('Notification toggle error:', error?.message || error);
			Alert.alert(
				'Error',
				'Failed to update notification settings. Please try again.',
			);
			setNotificationsEnabled(!value);
		}
	};

	const handleOrgNotificationToggle = async (orgId, value) => {
		if (!pushToken) return;
		try {
			await patchDevicePreferences(pushToken, orgId, value);
			setOrgNotificationPrefs((prev) => ({ ...prev, [orgId]: value }));
		} catch (e) {
			console.warn('Failed to update org notification preference:', e?.message || e);
			Alert.alert(
				'Error',
				'Failed to update notification setting for this organization. Please try again.',
			);
			setOrgNotificationPrefs((prev) => ({ ...prev, [orgId]: !value }));
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
				error.response?.data?.message || 'Failed to leave organization',
			);
		}
	};

	const handleFAQ = () => {
		console.log('Opening FAQ page');
	};

	const handleReportIssue = () => {
		navigation.navigate('ReportIssue');
	};

	const openDeleteModal = () => {
		setDeleteError('');
		setDeletePassword('');
		setDeleteModalVisible(true);
	};

	const closeDeleteModal = () => {
		setDeleteModalVisible(false);
		setDeletePassword('');
		setDeleteError('');
	};

	const handleDeleteAccount = async () => {
		const password = deletePassword.trim();
		if (!password) {
			setDeleteError('Please enter your password to confirm.');
			return;
		}
		setDeleteLoading(true);
		setDeleteError('');
		try {
			await usersApi.deleteAccount(password);
			closeDeleteModal();
			// Clear organization-specific data and theme (same as sign out) so auth screen doesn't keep church colors
			setOrganization(null);
			setAnnouncements([]);
			setEvents([]);
			setFamilyMembers({ activeConnections: [], pendingConnections: [] });
			setMinistries([]);
			setTeams([]);
			updateTheme(null);
			await clearUserAndToken();
			setAuth(false);
		} catch (error) {
			const message =
				error.response?.data?.message ||
				error.response?.data?.error ||
				'Failed to delete account. Please check your password and try again.';
			setDeleteError(message);
		} finally {
			setDeleteLoading(false);
		}
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
							<Text
								style={[
									styles.settingText,
									{ color: colors.text },
								]}>
								Allow Notifications
							</Text>
							<Switch
								value={notificationsEnabled}
								onValueChange={handleNotificationToggle}
								trackColor={{
									false:
										colorMode === 'dark'
											? '#767577'
											: '#ccc',
									true: organization.primaryColor,
								}}
								thumbColor={
									notificationsEnabled
										? '#fff'
										: '#f4f3f4'
								}
							/>
						</View>
						{!notificationsEnabled && Platform.OS === 'android' && (
							<Text
								style={[
									styles.settingText,
									{ color: colors.textSecondary, marginTop: 4, fontSize: 14 },
								]}>
								If the switch is disabled, enable notifications in your device settings and return here.
							</Text>
						)}
						{notificationsEnabled && pushToken && organizations.length > 0 && (
							<>
								<Text
									style={[
										styles.sectionTitle,
										{
											color: lightenColor(organization.primaryColor),
											fontSize: 16,
											marginTop: 16,
											marginBottom: 8,
										},
									]}>
									By organization
								</Text>
								{organizations.map((org) => (
									<View
										key={org.id}
										style={[
											styles.settingRow,
											{
												backgroundColor:
													colorMode === 'dark'
														? 'rgba(255, 255, 255, 0.1)'
														: 'rgba(0, 0, 0, 0.05)',
											},
										]}>
										<Text
											style={[
												styles.settingText,
												{ color: colors.text },
											]}
											numberOfLines={1}>
											{org.name || `Organization ${org.id}`}
										</Text>
										<Switch
											value={orgNotificationPrefs[org.id] !== false}
											onValueChange={(value) =>
												handleOrgNotificationToggle(org.id, value)
											}
											trackColor={{
												false:
													colorMode === 'dark'
														? '#767577'
														: '#ccc',
												true: organization.primaryColor,
											}}
											thumbColor={
												orgNotificationPrefs[org.id] !== false
													? '#fff'
													: '#f4f3f4'
											}
										/>
									</View>
								))}
							</>
						)}
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
							<Text
								style={[
									styles.buttonText,
									{ color: colors.text },
								]}>
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
							<Text
								style={[
									styles.buttonText,
									{ color: colors.text },
								]}>
								Report an Issue
							</Text>
						</TouchableOpacity>
					</Section>

					{!user.isGuest && (
						<Section
							title='Account'
							primaryColor={organization.primaryColor}>
							<TouchableOpacity
								style={[styles.settingButton, styles.deleteAccountButton]}
								onPress={openDeleteModal}>
								<Text style={styles.deleteAccountText}>
									Delete Account
								</Text>
							</TouchableOpacity>
						</Section>
					)}
				</View>
			</ScrollView>

			<Modal
				visible={deleteModalVisible}
				transparent
				animationType='fade'
				onRequestClose={closeDeleteModal}>
				<View style={styles.modalOverlay}>
					<View
						style={[
							styles.modalContent,
							{
								backgroundColor: colors.background || colors.cardBackground,
								borderColor: colors.border,
							},
						]}>
						<Text style={[styles.modalTitle, { color: colors.text }]}>
							Delete Account
						</Text>
						<Text
							style={[
								styles.modalDescription,
								{ color: colors.textSecondary },
							]}>
							This is a complete account deletion across all churches and cannot
							be reversed. All your data will be permanently removed.
						</Text>
						<Text
							style={[
								styles.modalDescription,
								{ color: colors.textSecondary, marginTop: 8 },
							]}>
							Enter your password below to confirm.
						</Text>
						<TextInput
							style={[
								styles.modalInput,
								{
									backgroundColor: colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
									color: colors.text,
									borderColor: colors.border || colors.textSecondary + '40',
								},
							]}
							placeholder='Your password'
							placeholderTextColor={colors.textSecondary}
							value={deletePassword}
							onChangeText={(text) => {
								setDeletePassword(text);
								setDeleteError('');
							}}
							secureTextEntry
							autoCapitalize='none'
							autoCorrect={false}
							editable={!deleteLoading}
						/>
						{deleteError ? (
							<Text style={[styles.modalError, { color: colors.warning || '#AD4343' }]}>
								{deleteError}
							</Text>
						) : null}
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[
									styles.modalButton,
									styles.modalButtonCancel,
									{ borderColor: colors.textSecondary },
								]}
								onPress={closeDeleteModal}
								disabled={deleteLoading}>
								<Text style={[styles.modalButtonCancelText, { color: colors.text }]}>
									Cancel
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonDelete]}
								onPress={handleDeleteAccount}
								disabled={deleteLoading}>
								{deleteLoading ? (
									<ActivityIndicator size='small' color='#fff' />
								) : (
									<Text style={styles.modalButtonDeleteText}>Delete Account</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
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
	deleteAccountButton: {
		backgroundColor: '#AD4343',
	},
	deleteAccountText: {
		...typography.body,
		fontSize: 16,
		color: 'white',
		textAlign: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	modalContent: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 16,
		borderWidth: 1,
		padding: 24,
	},
	modalTitle: {
		...typography.h2,
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 16,
		textAlign: 'center',
	},
	modalDescription: {
		...typography.body,
		fontSize: 15,
		lineHeight: 22,
		textAlign: 'center',
	},
	modalInput: {
		marginTop: 20,
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		fontSize: 16,
	},
	modalError: {
		...typography.body,
		fontSize: 14,
		marginTop: 10,
		textAlign: 'center',
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 24,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 48,
	},
	modalButtonCancel: {
		borderWidth: 1,
	},
	modalButtonCancelText: {
		...typography.body,
		fontSize: 16,
		fontWeight: '600',
	},
	modalButtonDelete: {
		backgroundColor: '#AD4343',
	},
	modalButtonDeleteText: {
		...typography.body,
		fontSize: 16,
		fontWeight: '600',
		color: 'white',
	},
});

export default SettingsScreen;
