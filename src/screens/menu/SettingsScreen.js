import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Switch,
	Linking,
	Alert,
	StyleSheet,
} from 'react-native';
import { useData } from '../../../context';
import { lightenColor } from '../../../shared/helper/colorFixer';
import Background from '../../../shared/components/Background';
import { usersApi } from '../../../api/userRoutes';
import { typography } from '../../../shared/styles/typography';

// Collapsible Section Component
const Section = ({ title, children, primaryColor, secondaryColor }) => (
	<View
		style={[
			styles.section,
			{
				borderColor: lightenColor(primaryColor),
				backgroundColor: lightenColor(primaryColor),
			},
		]}>
		<View style={styles.sectionHeader}>
			<Text style={[styles.sectionTitle, { color: secondaryColor }]}>
				{title}
			</Text>
		</View>
		<View style={styles.sectionContent}>{children}</View>
	</View>
);

const SettingsScreen = () => {
	const { user, organization, setUser, setAuth } = useData();
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);

	const handlePasswordChange = () => {
		console.log('password change request');
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
		Linking.openURL('mailto:help@assemblie.app');
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<Section
					title='Notifications'
					primaryColor={organization.primaryColor}
					secondaryColor={organization.secondaryColor}>
					<View
						style={[
							styles.settingRow,
							{
								backgroundColor: lightenColor(
									organization.secondaryColor
								),
							},
						]}>
						<Text style={styles.settingText}>
							Allow Notifications
						</Text>
						<Switch
							value={notificationsEnabled}
							onValueChange={setNotificationsEnabled}
						/>
					</View>
				</Section>

				<Section
					title='Security'
					primaryColor={organization.primaryColor}
					secondaryColor={organization.secondaryColor}>
					<TouchableOpacity
						style={[
							styles.settingButton,
							{
								backgroundColor: lightenColor(
									organization.secondaryColor
								),
							},
						]}
						onPress={handlePasswordChange}>
						<Text style={styles.buttonText}>Change Password</Text>
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
					primaryColor={organization.primaryColor}
					secondaryColor={organization.secondaryColor}>
					<TouchableOpacity
						style={[
							styles.settingButton,
							{
								backgroundColor: lightenColor(
									organization.secondaryColor
								),
							},
						]}
						onPress={handleFAQ}>
						<Text style={styles.buttonText}>FAQ</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.settingButton,
							{
								backgroundColor: lightenColor(
									organization.secondaryColor
								),
							},
						]}
						onPress={handleReportIssue}>
						<Text style={styles.buttonText}>Report an Issue</Text>
					</TouchableOpacity>
				</Section>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
		justifyContent: 'center',
		paddingBottom: 40,
	},
	section: {
		marginBottom: 16,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
	},
	sectionHeader: {
		padding: 12,
	},
	sectionTitle: {
		...typography.h3,
		textAlign: 'left',
		marginBottom: 4,
	},
	sectionContent: {
		padding: 12,
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		marginBottom: 8,
	},
	settingText: {
		...typography.body,
		flex: 1,
	},
	settingButton: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 8,
		elevation: 1,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.18,
		shadowRadius: 1.0,
	},
	buttonText: {
		...typography.body,
		textAlign: 'center',
	},
	dangerButton: {
		backgroundColor: '#FF3B30',
	},
	dangerText: {
		...typography.body,
		color: 'white',
		textAlign: 'center',
	},
});

export default SettingsScreen;
