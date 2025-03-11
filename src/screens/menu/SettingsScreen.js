import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Switch,
	Linking,
	Alert,
} from 'react-native';
import { useData } from '../../../context';
import { lightenColor } from '../../../shared/helper/colorFixer';
import Background from '../../../shared/components/Background';
import { usersApi } from '../../../api/userRoutes';

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
		<View style={[styles.sectionHeader]}>
			<Text style={styles.sectionTitle}>{title}</Text>
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
						<Text>Allow Notifications</Text>
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
						<Text>Change Password</Text>
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
						<Text>FAQ</Text>
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
						<Text>Report an Issue</Text>
					</TouchableOpacity>
				</Section>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		marginTop: '25%',
	},
	section: {
		marginBottom: 16,
		borderRadius: 8,
		overflow: 'hidden',
		borderWidth: 1,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	sectionContent: {
		padding: 16,
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		padding: 12,
		borderRadius: 6,
	},
	settingButton: {
		padding: 12,
		marginVertical: 4,
		borderRadius: 6,
	},
	dangerButton: {
		backgroundColor: '#ffebee',
	},
	dangerText: {
		color: '#d32f2f',
	},
});

export default SettingsScreen;
