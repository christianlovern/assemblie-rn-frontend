import React, { useState } from 'react';
import {
	Dimensions,
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
	Text,
	ScrollView,
} from 'react-native';
import { Formik } from 'formik';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import { usersApi } from '../../../api/userRoutes';

const dimensions = Dimensions.get('window');
const screenHeight = dimensions.height;

const VerifyCode = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { email } = route.params;
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { colors } = useTheme();

	const handleOnPress = async (values) => {
		if (!values.code || !values.newPassword || !values.confirmPassword) {
			setError('Please fill in all fields');
			return;
		}

		if (values.newPassword !== values.confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setIsLoading(true);
		try {
			// Ensure email is lowercase (in case it wasn't normalized earlier)
			const normalizedEmail = email?.toLowerCase().trim() || email;
			await usersApi.resetPassword(
				normalizedEmail,
				values.code,
				values.newPassword
			);
			navigation.navigate('AuthMain');	// navigate to the main auth screen
		} catch (error) {
			console.error('Password reset failed:', error);
			setError(error.message || 'Failed to reset password');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Background>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={styles.screenContainer}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps='handled'>
				<AuthHeader
					primaryText={'Reset Password'}
					secondaryText={
						'Enter the verification code and your new password'
					}
				/>
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{
							code: '',
							newPassword: '',
							confirmPassword: '',
						}}
						onSubmit={handleOnPress}>
						{({ values, handleSubmit, handleChange }) => (
							<>
								<View style={{ gap: 10 }}>
									<InputWithIcon
										inputType='text'
										placeholder='Enter 6 digit code'
										value={values.code}
										onChangeText={handleChange('code')}
										primaryColor={colors.buttons?.primary?.background || colors.primary}
										maxLength={6}
										keyboardType='numeric'
									/>
									<InputWithIcon
										inputType='password'
										placeholder='New Password'
										value={values.newPassword}
										onChangeText={handleChange(
											'newPassword'
										)}
										primaryColor={colors.buttons?.primary?.background || colors.primary}
									/>
									<View style={{ marginBottom: 20 }}>
										<InputWithIcon
											inputType='password'
											placeholder='Confirm New Password'
											value={values.confirmPassword}
											onChangeText={handleChange(
												'confirmPassword'
											)}
											primaryColor={colors.buttons?.primary?.background || colors.primary}
										/>
									</View>
								</View>
								{error && (
									<Text
										style={{
											color: 'red',
											marginVertical: 10,
										}}>
										{error}
									</Text>
								)}
								<Button
									type='primary'
									text='Reset Password'
									loading={isLoading}
									onPress={handleSubmit}
								/>
							</>
						)}
					</Formik>
				</View>
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		paddingBottom: screenHeight / 10,
		paddingHorizontal: 30,
	},
	formikContainer: {
		flex: 1,
		marginTop: '15%',
	},
});

export default VerifyCode;
