import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Switch,
	Linking,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { lightenColor } from '../../../shared/helper/colorFixer';
// Collapsible Section Component
const Section = ({ title, children, isExpanded, onPress, primaryColor }) => (
	<View style={[styles.section, { borderColor: lightenColor(primaryColor) }]}>
		<TouchableOpacity
			style={[styles.sectionHeader]}
			onPress={onPress}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<Text>{isExpanded ? '▼' : '▶'}</Text>
		</TouchableOpacity>
		{isExpanded && <View style={styles.sectionContent}>{children}</View>}
	</View>
);

const SettingsScreen = () => {
	const { user, organization, setUser, setAuth } = useData();
	const [expandedSection, setExpandedSection] = useState(null);
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);

	const toggleSection = (section) => {
		setExpandedSection(expandedSection === section ? null : section);
	};

	const handlePasswordChange = () => {
		console.log('password change request');
	};

	const handleLeaveOrganization = () => {
		// Add confirmation dialog in production
		setUser({});
		setAuth(false);
	};

	const handleFAQ = () => {
		console.log('Opening FAQ page');
	};

	const handleReportIssue = () => {
		Linking.openURL('mailto:help@CongreGate.app');
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<Section
					title='Notifications'
					isExpanded={expandedSection === 'notifications'}
					onPress={() => toggleSection('notifications')}>
					<View
						style={[
							styles.settingRow,
							{
								backgroundColor: lightenColor(
									organization.primaryColor
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
					isExpanded={expandedSection === 'security'}
					onPress={() => toggleSection('security')}>
					<TouchableOpacity
						style={[
							styles.settingButton,
							{
								backgroundColor: lightenColor(
									organization.primaryColor
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
					isExpanded={expandedSection === 'help'}
					onPress={() => toggleSection('help')}>
					<TouchableOpacity
						style={[
							styles.settingButton,
							{
								backgroundColor: lightenColor(
									organization.primaryColor
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
									organization.primaryColor
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
