import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	StyleSheet,
	Keyboard,
	ActivityIndicator,
	Platform,
	TouchableWithoutFeedback,
	Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../../../context';
import Background from '../../../shared/components/Background';
import { typography } from '../../../shared/styles/typography';
import { usersApi } from '../../../api/userRoutes';
import Constants from 'expo-constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const ReportIssueScreen = () => {
	const navigation = useNavigation();
	const { organization, user } = useData();
	const { colors, colorMode } = useTheme();

	if (!user || !organization) {
		return null;
	}
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [screenshotUri, setScreenshotUri] = useState(null);
	const [formData, setFormData] = useState({
		name: `${user.firstName} ${user.lastName}`,
		email: user.email,
		organizationName: organization.name,
		message: '',
		platform: Platform.OS,
		appVersion: Constants.expoConfig?.version ?? '',
	});

	const backgroundColor =
		colorMode === 'dark'
			? 'rgba(255, 255, 255, 0.1)'
			: 'rgba(255, 255, 255, 0.9)';

	const pickScreenshot = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert(
				'Permission needed',
				'Please allow access to your photos to attach a screenshot.',
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaType?.Images ?? 'images',
			allowsEditing: true,
			aspect: [16, 9],
			quality: 0.8,
		});
		if (!result.canceled) {
			setScreenshotUri(result.assets[0].uri);
		}
	};

	const handleSubmit = async () => {
		if (!formData.message.trim()) {
			Alert.alert(
				'Error',
				'Please describe the issue you are experiencing',
			);
			return;
		}

		setIsSubmitting(true);

		try {
			await usersApi.sendContactEmail(
				{
					name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
					email: user.email ?? '',
					organizationName: organization.name ?? '',
					message: formData.message.trim(),
					platform: Platform.OS,
					appVersion: Constants.expoConfig?.version ?? '',
					subject: 'Mobile App Issue Report',
					template: 'issueReport',
				},
				screenshotUri || undefined,
			);

			Alert.alert(
				'Success',
				'Your message has been sent successfully. We will get back to you soon.',
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				],
			);
		} catch (error) {
			Alert.alert(
				'Error',
				error.message ||
					'Failed to send message. Please try again later.',
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
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={styles.container}>
					<Text style={[styles.title, { color: colors.text }]}>
						Report an Issue
					</Text>

					<View style={styles.formContainer}>
						<View style={styles.inputGroup}>
							<Text
								style={[styles.label, { color: colors.text }]}>
								Name
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: backgroundColor,
										fontFamily: typography.body.fontFamily,
										fontSize: typography.body.fontSize,
										color: colors.text,
									},
								]}
								value={formData.name}
								editable={false}
							/>
						</View>

						<View style={styles.inputGroup}>
							<Text
								style={[styles.label, { color: colors.text }]}>
								Message
							</Text>
							<TextInput
								style={[
									styles.messageInput,
									{
										backgroundColor: backgroundColor,
										color: colors.text,
										fontFamily: typography.body.fontFamily,
										fontSize: typography.body.fontSize,
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

						<View style={styles.inputGroup}>
							<Text
								style={[styles.label, { color: colors.text }]}>
								Screenshot (optional)
							</Text>
							{screenshotUri ? (
								<View style={styles.screenshotRow}>
									<Image
										source={{ uri: screenshotUri }}
										style={styles.screenshotThumb}
										resizeMode='cover'
									/>
									<TouchableOpacity
										style={[
											styles.removeScreenshotBtn,
											{
												borderColor:
													colors.textSecondary,
											},
										]}
										onPress={() => setScreenshotUri(null)}>
										<Icon
											name='close'
											size={20}
											color={colors.textSecondary}
										/>
										<Text
											style={[
												styles.removeScreenshotText,
												{ color: colors.textSecondary },
											]}>
											Remove
										</Text>
									</TouchableOpacity>
								</View>
							) : (
								<TouchableOpacity
									style={[
										styles.attachBtn,
										{
											backgroundColor: backgroundColor,
											borderColor: colors.textSecondary,
										},
									]}
									onPress={pickScreenshot}>
									<Icon
										name='add-photo-alternate'
										size={24}
										color={colors.textSecondary}
									/>
									<Text
										style={[
											styles.attachBtnText,
											{ color: colors.textSecondary },
										]}>
										Attach screenshot
									</Text>
								</TouchableOpacity>
							)}
						</View>

						<TouchableOpacity
							style={[
								styles.button,
								{
									backgroundColor:
										organization.secondaryColor,
								},
								isSubmitting && styles.buttonDisabled,
							]}
							onPress={handleSubmit}
							disabled={isSubmitting}>
							{isSubmitting ? (
								<ActivityIndicator color='white' />
							) : (
								<Text style={styles.buttonText}>
									Send Message
								</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</TouchableWithoutFeedback>
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
		fontWeight: '600',
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
	screenshotRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	screenshotThumb: {
		width: 80,
		height: 45,
		borderRadius: 6,
	},
	removeScreenshotBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderRadius: 8,
	},
	removeScreenshotText: {
		...typography.body,
		fontSize: 14,
	},
	attachBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 14,
		borderRadius: 8,
		borderWidth: 1,
		borderStyle: 'dashed',
	},
	attachBtnText: {
		...typography.body,
		fontSize: 15,
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
