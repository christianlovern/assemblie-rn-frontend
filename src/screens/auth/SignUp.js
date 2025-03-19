import React, { useState } from 'react';
import {
	Dimensions,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	View,
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

import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../../utils/notificationUtils';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const SignUp = () => {
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { colors } = useTheme();
	const { auth, setAuth, user, setUser, setOrganization } = useData();

	const handleOnPress = async (values) => {
		setError('');
		if (
			!values.firstName ||
			!values.lastName ||
			!values.email ||
			!values.password ||
			!values.confirmPassword ||
			!values.phoneNumber ||
			!values.orgPin
		) {
			setError('missingValue');
			return;
		} else if (values.password !== values.confirmPassword) {
			setError('passwordMismatch');
			return;
		} else if (values.phoneNumber.length < 10) {
			setError('incorrectPhone');
			return;
		}

		setIsLoading(true);
		try {
			let res = await signUpUser(values);
			if (res.status == 200) {
				setUser(res.data.user);
				setOrganization(res.data.organization);
				setAuth(!auth);

				// Register for push notifications after successful signup
				const pushToken = await registerForPushNotificationsAsync();
				if (pushToken) {
					await sendPushTokenToBackend(
						pushToken,
						res.data.user.id,
						res.data.organization.id
					);
				}
			}
		} catch (error) {
			console.error('Signup failed:', error);
			setError('signupFailed');
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
							firstName: 'Christian 3',
							lastName: 'Test',
							email: 'christianTester3@apptest.com',
							password: '1234567890',
							phoneNumber: '',
							confirmPassword: '1234567890',
							orgPin: '12345',
						}}
						onSubmit={handleOnPress}>
						{({ handleSubmit, handleChange, values }) => (
							<View style={{ marginTop: 20 }}>
								<InputWithIcon
									inputType='user-first'
									value={values.firstName}
									onChangeText={handleChange('firstName')}
									primaryColor={colors.primary}
								/>
								<InputWithIcon
									inputType='user-last'
									value={values.lastName}
									onChangeText={handleChange('lastName')}
									primaryColor={colors.primary}
								/>
								<InputWithIcon
									inputType='email'
									value={values.email}
									onChangeText={handleChange('email')}
									primaryColor={colors.primary}
								/>
								<InputWithIcon
									inputType='password'
									value={values.password}
									onChangeText={handleChange('password')}
									primaryColor={colors.primary}
								/>
								<InputWithIcon
									inputType='confirmPassword'
									value={values.confirmPassword}
									onChangeText={handleChange(
										'confirmPassword'
									)}
									primaryColor={colors.primary}
								/>
								<InputWithIcon
									inputType='pin'
									value={values.orgPin}
									onChangeText={handleChange('orgPin')}
									primaryColor={colors.primary}
								/>
								<InputWithIcon
									inputType='phone'
									value={values.phoneNumber}
									onChangeText={handleChange('phoneNumber')}
									primaryColor={colors.primary}
								/>
								<Button
									type='gradient'
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
});

export default SignUp;
