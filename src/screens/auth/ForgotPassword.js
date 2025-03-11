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
import globalStyles from '../../../shared/styles/globalStyles';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';

const dimensions = Dimensions.get('window');
const screenHeight = dimensions.height;

const ForgotPassword = () => {
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleOnPress = async (values) => {
		if (!values.email) {
			setError('missingValue');
			return;
		}

		setIsLoading(true);
		try {
			// Make API call to request password reset code
			const response = await fetch('YOUR_API_ENDPOINT/forgot-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: values.email }),
			});

			if (!response.ok) {
				throw new Error('Failed to send reset code');
			}

			// Navigate to verification screen with email
			navigation.navigate('VerifyCode', { email: values.email });
		} catch (error) {
			console.error('Password reset request failed:', error);
			setError('resetFailed');
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
										primaryColor={
											globalStyles.colorPallet.primary
										}
									/>
								</View>
								<Button
									type='gradient'
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
