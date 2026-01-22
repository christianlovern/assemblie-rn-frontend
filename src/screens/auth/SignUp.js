import React, { useState } from 'react';
import {
	Dimensions,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	View,
	Text,
} from 'react-native';
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import { signUpUser } from '../../../api/userRoutes';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import * as SecureStore from 'expo-secure-store';

import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../../utils/notificationUtils';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const SignUp = () => {
	const navigation = useNavigation();
	const { colors, updateTheme } = useTheme();
	const [error, setError] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
		phoneNumber: '',
		orgPin: '',
		general: '',
	});
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { auth, setAuth, setOrganization, setUserAndToken } = useData();

	const validateEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validatePhone = (phone) => {
		// Remove all non-digit characters except '+'
		const cleanPhone = phone.replace(/[^\d+]/g, '');

		// If empty, it's valid (since phone is optional)
		if (cleanPhone === '') return true;

		// Check if starts with '+' for international format
		if (cleanPhone.startsWith('+')) {
			return /^\+\d{11,14}$/.test(cleanPhone);
		} else {
			return /^\d{10}$/.test(cleanPhone);
		}
	};

	const handleOnPress = async (values) => {
		// Reset all errors
		setError({
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			confirmPassword: '',
			phoneNumber: '',
			orgPin: '',
			general: '',
		});

		// Validate all fields
		let hasError = false;

		if (!values.firstName?.trim()) {
			setError((prev) => ({
				...prev,
				firstName: 'First name is required',
			}));
			hasError = true;
		}

		if (!values.lastName?.trim()) {
			setError((prev) => ({
				...prev,
				lastName: 'Last name is required',
			}));
			hasError = true;
		}

		if (!values.email?.trim()) {
			setError((prev) => ({ ...prev, email: 'Email is required' }));
			hasError = true;
		} else if (!validateEmail(values.email)) {
			setError((prev) => ({
				...prev,
				email: 'Please enter a valid email address',
			}));
			hasError = true;
		}

		if (!values.password) {
			setError((prev) => ({ ...prev, password: 'Password is required' }));
			hasError = true;
		}

		if (!values.confirmPassword) {
			setError((prev) => ({
				...prev,
				confirmPassword: 'Please confirm your password',
			}));
			hasError = true;
		} else if (values.password !== values.confirmPassword) {
			setError((prev) => ({
				...prev,
				confirmPassword: 'Passwords do not match',
			}));
			hasError = true;
		}

		if (!values.phoneNumber) {
			setError((prev) => ({
				...prev,
				phoneNumber: 'Phone number is required',
			}));
			hasError = true;
		} else if (!validatePhone(values.phoneNumber)) {
			setError((prev) => ({
				...prev,
				phoneNumber: 'Please enter a valid phone number',
			}));
			hasError = true;
		}

		if (!values.orgPin?.trim()) {
			setError((prev) => ({
				...prev,
				orgPin: 'Organization PIN is required',
			}));
			hasError = true;
		}

		if (hasError) return;

		setIsLoading(true);
		try {
			// Convert email to lowercase before sending to backend
			const normalizedValues = {
				...values,
				email: values.email.toLowerCase().trim(),
			};
			let res = await signUpUser(normalizedValues);
			if (res.status == 200) {
				const userData = res.data.user;
				const token = res.data.token;

				console.log('Signup response:', { userData, token }); // Debug log

				if (!token) {
					throw new Error('No token received from server');
				}

				// Set user and token, and wait for it to complete
				await setUserAndToken(userData, token);

				// Verify token was set
				const storedToken = await SecureStore.getItemAsync('userToken');
				console.log('Stored token:', storedToken); // Debug log

				if (!storedToken) {
					throw new Error('Token not stored properly');
				}

				// Now that we're sure the token is set, trigger auth state change
				setAuth(true);

				// Move push notification registration to after navigation
				setTimeout(async () => {
					try {
						const pushToken =
							await registerForPushNotificationsAsync();
						if (pushToken && userData.organization) {
							await sendPushTokenToBackend(
								pushToken,
								userData.id,
								userData.organization.id
							);
						}
					} catch (notificationError) {
						console.error(
							'Push notification setup failed:',
							notificationError
						);
					}
				}, 1000);
			}
		} catch (error) {
			console.error('Signup failed:', error);
			setError((prev) => ({
				...prev,
				general:
					error.response?.data?.message ||
					error.message ||
					'Failed to create account. Please try again.',
			}));
		} finally {
			setIsLoading(false);
		}
	};

	const toggleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	return (
		<Background>
			<KeyboardAvoidingView
				style={styles.screenContainer}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				<AuthHeader primaryText={'Get Started'} />
				<ScrollView
					contentContainerStyle={styles.scrollViewContainer}
					showsVerticalScrollIndicator={false}>
					<Formik
						initialValues={{
							firstName: '',
							lastName: '',
							email: '',
							password: '',
							phoneNumber: '',
							confirmPassword: '',
							orgPin: '',
						}}
						onSubmit={handleOnPress}>
						{({ handleSubmit, handleChange, values }) => (
							<View style={{ marginTop: 20 }}>
								<InputWithIcon
									inputType='user-first'
									value={values.firstName}
									onChangeText={(value) => {
										handleChange('firstName')(value);
										setError((prev) => ({
											...prev,
											firstName: '',
										}));
									}}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								{error.firstName ? (
									<Text style={styles.errorText}>
										{error.firstName}
									</Text>
								) : null}
								<InputWithIcon
									inputType='user-last'
									value={values.lastName}
									onChangeText={handleChange('lastName')}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								<InputWithIcon
									inputType='email'
									value={values.email}
									onChangeText={handleChange('email')}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								{error.email ? (
									<Text style={styles.errorText}>
										{error.email}
									</Text>
								) : null}
								<InputWithIcon
									inputType='password'
									value={values.password}
									onChangeText={handleChange('password')}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								<InputWithIcon
									inputType='confirmPassword'
									value={values.confirmPassword}
									onChangeText={handleChange(
										'confirmPassword'
									)}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								{error.confirmPassword ? (
									<Text style={styles.errorText}>
										{error.confirmPassword}
									</Text>
								) : null}
								<InputWithIcon
									inputType='pin'
									value={values.orgPin}
									onChangeText={handleChange('orgPin')}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								{error.orgPin ? (
									<Text style={styles.errorText}>
										{error.orgPin}
									</Text>
								) : null}
								<InputWithIcon
									inputType='phone'
									value={values.phoneNumber}
									onChangeText={handleChange('phoneNumber')}
									primaryColor={colors.buttons?.primary?.background || colors.primary}
								/>
								{error.phoneNumber ? (
									<Text style={styles.errorText}>
										{error.phoneNumber}
									</Text>
								) : null}
								{error.general ? (
									<Text
										style={[
											styles.errorText,
											{ textAlign: 'center' },
										]}>
										{error.general}
									</Text>
								) : null}
								<Button
									type='primary'
									text='Sign up'
									loading={isLoading}
									onPress={handleSubmit}
								/>
							</View>
						)}
					</Formik>
				</ScrollView>
			</KeyboardAvoidingView>
		</Background>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		paddingBottom: screenHeight / 10,
		paddingHorizontal: 30,
		justifyContent: 'space-between',
	},
	scrollViewContainer: {
		paddingBottom: 50, // Adjust bottom padding if necessary to avoid UI cut off
	},
	errorText: {
		fontSize: 14,
		marginTop: -15,
		marginBottom: 15,
		marginLeft: 5,
		color: '#a44c62',
		fontWeight: 'bold',
	},
});

export default SignUp;
