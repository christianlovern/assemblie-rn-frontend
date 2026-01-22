import React, { useState } from 'react';
import {
	Dimensions,
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import { usersApi } from '../../../api/userRoutes';

const dimensions = Dimensions.get('window');
const screenHeight = dimensions.height;

const ForgotPassword = () => {
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { colors } = useTheme();
	const [success, setSuccess] = useState(false);

	const handleOnPress = async (values) => {
		if (!values.email) {
			setError('missingValue');
			return;
		}

		setIsLoading(true);
		try {
			// Convert email to lowercase before sending to backend
			const normalizedEmail = values.email.toLowerCase().trim();
			await usersApi.sendPasswordResetEmail(normalizedEmail);
			// Navigate to verification screen with normalized email
			navigation.navigate('VerifyCode', { email: normalizedEmail });
		} catch (error) {
			console.error('Password reset request failed:', error);
			setError(error.message || 'Failed to send reset code');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Background>
			<KeyboardAvoidingView
				style={styles.screenContainer}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				<AuthHeader
					primaryText={'Reset Password'}
					secondaryText={
						'Enter your email address to reset your password'
					}
				/>
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{
							email: '',
						}}
						onSubmit={(values) => handleOnPress(values)}>
						{({
							values,
							handleSubmit,
							handleChange,
							setFieldTouched,
						}) => (
							<>
								<View style={{ marginBottom: 20 }}>
									<InputWithIcon
										inputType='email'
										value={values.email}
										onChangeText={handleChange('email')}
										primaryColor={colors.buttons?.primary?.background || colors.primary}
									/>
								</View>
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
			</KeyboardAvoidingView>
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

export default ForgotPassword;
