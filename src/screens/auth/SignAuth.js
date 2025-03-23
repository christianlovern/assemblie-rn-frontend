import React, { useState } from 'react';
import {
	Dimensions,
	Image,
	StyleSheet,
	TextInput,
	View,
	Text,
	Pressable,
} from 'react-native';
import { Formik } from 'formik';
// import AuthModal from '../../shared/modal/AuthModal';
import { useNavigation } from '@react-navigation/native';
import { signInUser } from '../../../api/userRoutes';
import { useData } from '../../../context';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';

import { useTheme } from '../../../contexts/ThemeContext';
import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../../utils/notificationUtils';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const SignAuth = () => {
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { colors, updateTheme } = useTheme();

	const { auth, setAuth, setUser, setTeams, setOrganization } = useData();
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');

	const handleOnPress = async (values) => {
		// Reset error states
		setEmailError('');
		setPasswordError('');

		if (!values.email && !values.password) {
			setEmailError('Email is required');
			setPasswordError('Password is required');
			return;
		}
		if (!values.email) {
			setEmailError('Email is required');
			return;
		}
		if (!values.password) {
			setPasswordError('Password is required');
			return;
		}

		setIsLoading(true);
		try {
			let res = await signInUser(values);
			if (res.status == 200) {
				const userData = res.data.user;
				const orgData = userData.organization;

				console.log('User Data:', userData); // Add this log
				console.log('Organization Data:', orgData); // Add this log

				// Set the user data in context
				setUser(userData);
				setOrganization(orgData);

				// Update theme with organization colors
				updateTheme({
					primary: orgData.primaryColor,
					secondary: orgData.secondaryColor,
					background: '#1A1A1A',
					surface: '#2A2A2A',
					error: '#a44c62',
					textWhite: '#FFFFFF',
					textBlack: '#000000',
				});

				// Wait for context to update before registering device
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Register for push notifications and send token to backend
				try {
					const pushToken = await registerForPushNotificationsAsync();
					if (pushToken) {
						// Pass organization ID explicitly
						await sendPushTokenToBackend(pushToken, orgData.id);
					}
				} catch (notificationError) {
					console.error(
						'Push notification setup failed:',
						notificationError
					);
				}

				// Set auth state to trigger MainStack
				setAuth(true);
			} else {
				setError('loginFailed');
			}
		} catch (error) {
			console.log('ERROR', error);
			if (error.response?.data?.errors?.email) {
				setEmailError(error.response.data.errors.email);
			} else {
				setEmailError('An error occurred during login');
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
				<AuthHeader primaryText={'Welcome Back'} />
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{
							// email: '',
							// password: '',
							email: 'clovern.assemblie@gmail.com',
							password: 'Chr1st!anL0vern',
							// email: 'DanielAtkins@assemblie.test',
							// password: 'Password1!',
						}}
						onSubmit={(values) => {
							handleOnPress(values);
						}}>
						{({
							values,
							handleSubmit,
							handleChange,
							setFieldTouched,
						}) => (
							<>
								{error === 'loginFailed' && (
									<Text style={[styles.errorText]}>
										Invalid email or password
									</Text>
								)}
								<InputWithIcon
									inputType='email'
									value={values.email}
									onChangeText={(text) => {
										handleChange('email')(text);
										setEmailError('');
									}}
									primaryColor={colors.primary}
								/>
								{emailError ? (
									<Text style={[styles.errorText]}>
										{emailError}
									</Text>
								) : null}

								<InputWithIcon
									inputType='password'
									value={values.password}
									onChangeText={(text) => {
										handleChange('password')(text);
										setPasswordError('');
									}}
									primaryColor={colors.primary}
								/>
								{passwordError ? (
									<Text style={[styles.errorText]}>
										{passwordError}
									</Text>
								) : null}

								<Pressable
									style={({ pressed }) => [
										pressed ? { opacity: 0.6 } : {},
									]}
									onPress={() =>
										navigation.navigate('ForgotPassword')
									}>
									<Text
										style={[
											styles.textAlt,
											{ color: colors.textWhite },
										]}>
										{'Forgot Password'}
									</Text>
								</Pressable>
								<Button
									type='gradient'
									text='Sign In'
									loading={isLoading}
									onPress={() => {
										handleSubmit();
									}}
								/>
							</>
						)}
					</Formik>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		// justifyContent: 'center',
		paddingBottom: screenHeight / 10,
		paddingHorizontal: 30,
	},
	formikContainer: {
		flex: 1,
		marginTop: '20%',
	},
	textAlt: {
		fontSize: 18,
		alignSelf: 'flex-end',
		marginBottom: 20,
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
export default SignAuth;
