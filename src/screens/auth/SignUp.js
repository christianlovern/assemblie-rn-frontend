import React, { useState, useRef } from 'react';
import { Dimensions, StyleSheet, Platform, View, Text } from 'react-native';
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import { signUpUser } from '../../../api/userRoutes';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import KeyboardAwareScrollView from '../../../shared/components/KeyboardAwareScrollView';
import { useScrollToFirstError } from '../../../shared/hooks/useScrollToFirstError';
import * as SecureStore from 'expo-secure-store';

import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../../utils/notificationUtils';
import { normalizePhone, formatPhoneForDisplay } from '../../utils/phoneUtils';

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

	const scrollViewRef = useRef(null);
	const scrollContentRef = useRef(null);
	const firstNameFieldRef = useRef(null);
	const lastNameFieldRef = useRef(null);
	const emailFieldRef = useRef(null);
	const passwordFieldRef = useRef(null);
	const confirmPasswordFieldRef = useRef(null);
	const orgPinFieldRef = useRef(null);
	const phoneNumberFieldRef = useRef(null);

	const fieldOrder = [
		'firstName',
		'lastName',
		'email',
		'password',
		'confirmPassword',
		'orgPin',
		'phoneNumber',
	];
	const fieldRefs = {
		firstName: firstNameFieldRef,
		lastName: lastNameFieldRef,
		email: emailFieldRef,
		password: passwordFieldRef,
		confirmPassword: confirmPasswordFieldRef,
		orgPin: orgPinFieldRef,
		phoneNumber: phoneNumberFieldRef,
	};
	const { scrollToFirstError } = useScrollToFirstError(
		scrollViewRef,
		scrollContentRef,
		fieldRefs,
		fieldOrder,
		{ scrollOffset: 100 },
	);

	const {
		auth,
		setAuth,
		setOrganization,
		setUserAndToken,
		pendingOrg,
		setPendingOrg,
	} = useData();

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
		// Build all field errors for validation and scroll-to-first
		const errors = {};

		if (!values.firstName?.trim()) {
			errors.firstName = 'First name is required';
		}
		if (!values.lastName?.trim()) {
			errors.lastName = 'Last name is required';
		}
		if (!values.email?.trim()) {
			errors.email = 'Email is required';
		} else if (!validateEmail(values.email)) {
			errors.email = 'Please enter a valid email address';
		}
		if (!values.password) {
			errors.password = 'Password is required';
		}
		if (!values.confirmPassword) {
			errors.confirmPassword = 'Please confirm your password';
		} else if (values.password !== values.confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}
		if (!values.orgPin?.trim()) {
			errors.orgPin = 'Organization PIN is required';
		}
		const phoneNormalized = normalizePhone(values.phoneNumber);
		if (!phoneNormalized) {
			errors.phoneNumber = 'Phone number is required';
		} else if (!validatePhone(phoneNormalized)) {
			errors.phoneNumber = 'Please enter a valid phone number';
		}

		const hasError = Object.keys(errors).length > 0;
		if (hasError) {
			setError({
				...errors,
				general: '',
			});
			setTimeout(() => scrollToFirstError(errors), 100);
			return;
		}

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

		setIsLoading(true);
		try {
			// Normalize before sending: email lowercase, phone digits, orgPin uppercase
			const normalizedValues = {
				...values,
				email: values.email.toLowerCase().trim(),
				phoneNumber: normalizePhone(values.phoneNumber),
				orgPin: values.orgPin?.trim().toUpperCase() ?? '',
			};
			let res = await signUpUser(normalizedValues);
			console.log('res signUpUser', res);
			if (res.status === 200 || res.status === 201) {
				const userData = res.data.user;
				const token = res.data.token;

				console.log('Signup response:', { userData, token }); // Debug log

				if (!token) {
					throw new Error('No token received from server');
				}

				// Set user and token, and wait for it to complete
				await setUserAndToken(userData, token);
				setPendingOrg({ id: null, orgPin: null });

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
								userData.organization.id,
							);
						}
					} catch (notificationError) {
						console.error(
							'Push notification setup failed:',
							notificationError,
						);
					}
				}, 1000);
			}
		} catch (error) {
			console.error('Signup failed:', error);
			const apiErrors = error.response?.data?.errors;
			const fieldErrors =
				apiErrors && typeof apiErrors === 'object' ? apiErrors : {};
			const generalMessage =
				Object.keys(fieldErrors).length > 0
					? 'Something went wrong. Please try again.'
					: error.response?.data?.message ||
						error.message ||
						'Failed to create account. Please try again.';
			setError((prev) => ({
				...prev,
				...fieldErrors,
				general: generalMessage,
			}));
			if (Object.keys(fieldErrors).length > 0) {
				setTimeout(() => scrollToFirstError(fieldErrors), 100);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const toggleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	return (
		<Background>
			<View style={styles.screenContainer}>
				<AuthHeader primaryText={'Get Started'} />
				<View style={styles.scrollWrapper}>
					<KeyboardAwareScrollView
						scrollViewRef={scrollViewRef}
						contentContainerStyle={styles.scrollViewContainer}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
						showsVerticalScrollIndicator={false}>
					<Formik
						initialValues={{
							firstName: '',
							lastName: '',
							email: '',
							password: '',
							phoneNumber: '',
							confirmPassword: '',
							orgPin: pendingOrg.orgPin || '',
						}}
						onSubmit={handleOnPress}>
						{({ handleSubmit, handleChange, values }) => (
							<View
								ref={scrollContentRef}
								style={styles.formContent}>
								<View ref={firstNameFieldRef}>
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
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={error.firstName || undefined}
									/>
								</View>

								<View ref={lastNameFieldRef}>
									<InputWithIcon
										inputType='user-last'
										value={values.lastName}
										onChangeText={(value) => {
											handleChange('lastName')(value);
											setError((prev) => ({
												...prev,
												lastName: '',
											}));
										}}
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={error.lastName || undefined}
									/>
								</View>

								<View ref={emailFieldRef}>
									<InputWithIcon
										inputType='email'
										value={values.email}
										onChangeText={(value) => {
											handleChange('email')(value);
											setError((prev) => ({
												...prev,
												email: '',
											}));
										}}
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={error.email || undefined}
									/>
								</View>

								<View ref={passwordFieldRef}>
									<InputWithIcon
										inputType='password'
										value={values.password}
										onChangeText={(value) => {
											handleChange('password')(value);
											setError((prev) => ({
												...prev,
												password: '',
											}));
										}}
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={error.password || undefined}
									/>
								</View>

								<View ref={confirmPasswordFieldRef}>
									<InputWithIcon
										inputType='confirmPassword'
										value={values.confirmPassword}
										onChangeText={(value) => {
											handleChange('confirmPassword')(
												value,
											);
											setError((prev) => ({
												...prev,
												confirmPassword: '',
											}));
										}}
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={
											error.confirmPassword || undefined
										}
									/>
								</View>

								<View ref={orgPinFieldRef}>
									<InputWithIcon
										inputType='pin'
										value={values.orgPin.toUpperCase()}
										onChangeText={(value) => {
											handleChange('orgPin')(
												value.trim().toUpperCase(),
											);
											setError((prev) => ({
												...prev,
												orgPin: '',
											}));
										}}
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={error.orgPin || undefined}
										autoComplete='off'
										autoCorrect={false}
									/>
								</View>

								<View ref={phoneNumberFieldRef}>
									<InputWithIcon
										inputType='phone'
										value={formatPhoneForDisplay(
											values.phoneNumber,
										)}
										onChangeText={(value) => {
											handleChange('phoneNumber')(
												normalizePhone(value),
											);
											setError((prev) => ({
												...prev,
												phoneNumber: '',
											}));
										}}
										primaryColor={
											colors.buttons?.primary
												?.background || colors.primary
										}
										error={error.phoneNumber || undefined}
									/>
								</View>

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
					</KeyboardAwareScrollView>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		paddingHorizontal: 30,
	},
	scrollWrapper: {
		flex: 1,
		paddingBottom: screenHeight / 10,
	},
	scrollViewContainer: {
		paddingBottom: 120,
		flexGrow: 1,
	},
	formContent: {
		marginTop: 20,
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
