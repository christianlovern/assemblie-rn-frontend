import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	StyleSheet,
	ActivityIndicator,
	Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../../context';
import Background from '../../../shared/components/Background';
import { typography } from '../../../shared/styles/typography';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { usersApi } from '../../../api/userRoutes';
import Constants from 'expo-constants';

const ReportIssueScreen = () => {
	const navigation = useNavigation();
	const { organization, user } = useData();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: `${user.firstName} ${user.lastName}`,
		email: user.email,
		organizationName: organization.name,
		message: '',
		platform: Platform.OS,
		appVersion: Constants.expoConfig.version,
	});

	const handleSubmit = async () => {
		if (!formData.message.trim()) {
			Alert.alert(
				'Error',
				'Please describe the issue you are experiencing'
			);
			return;
		}

		setIsSubmitting(true);

		try {
			await usersApi.sendContactEmail({
				...formData,
				isInquiry: true,
				subject: 'Mobile App Issue Report',
				template: 'issueReport',
			});

			Alert.alert(
				'Success',
				'Your message has been sent successfully. We will get back to you soon.',
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]
			);
		} catch (error) {
			Alert.alert(
				'Error',
				error.message ||
					'Failed to send message. Please try again later.'
			);
			console.error('Error sending message:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<Text
					style={[
						styles.title,
						{ color: organization.secondaryColor },
					]}>
					Report an Issue
				</Text>

				<View style={styles.formContainer}>
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Name</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: lightenColor(
										organization.secondaryColor
									),
								},
							]}
							value={formData.name}
							editable={false}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Message</Text>
						<TextInput
							style={[
								styles.messageInput,
								{
									backgroundColor: lightenColor(
										organization.secondaryColor
									),
								},
							]}
							multiline
							numberOfLines={12}
							placeholder="Describe the issue you're experiencing..."
							value={formData.message}
							onChangeText={(text) =>
								setFormData((prev) => ({
									...prev,
									message: text,
								}))
							}
						/>
					</View>

					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: organization.secondaryColor },
							isSubmitting && styles.buttonDisabled,
						]}
						onPress={handleSubmit}
						disabled={isSubmitting}>
						{isSubmitting ? (
							<ActivityIndicator color='white' />
						) : (
							<Text style={styles.buttonText}>Send Message</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	title: {
		...typography.h2,
		marginBottom: 24,
		textAlign: 'center',
	},
	formContainer: {
		flex: 1,
		marginTop: 20,
	},
	inputGroup: {
		marginBottom: 20,
	},
	label: {
		...typography.body,
		marginBottom: 8,
	},
	input: {
		height: 50,
		borderRadius: 8,
		paddingHorizontal: 16,
		...typography.body,
	},
	messageInput: {
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 12,
		minHeight: 200,
		textAlignVertical: 'top',
		...typography.body,
	},
	button: {
		height: 50,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 16,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		...typography.body,
		color: 'white',
	},
});

export default ReportIssueScreen;
