import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Formik } from 'formik';
import { useNavigation, useRoute } from '@react-navigation/native';
import globalStyles from '../../../shared/styles/globalStyles';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';

const ResetPassword = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { email, code } = route.params;
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleResetPassword = async (values) => {
		if (values.password !== values.confirmPassword) {
			setError('passwordMismatch');
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch('YOUR_API_ENDPOINT/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					code,
					newPassword: values.password,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to reset password');
			}

			navigation.navigate('SignAuth');
		} catch (error) {
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
					secondaryText={'Enter your new password'}
				/>
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{
							password: '',
							confirmPassword: '',
						}}
						onSubmit={handleResetPassword}>
						{({ values, handleSubmit, handleChange }) => (
							<>
								<View style={{ marginBottom: 20 }}>
									<InputWithIcon
										inputType='password'
										value={values.password}
										onChangeText={handleChange('password')}
										primaryColor={
											globalStyles.colorPallet.primary
										}
										placeholder='New password'
									/>
								</View>
								<View style={{ marginBottom: 20 }}>
									<InputWithIcon
										inputType='password'
										value={values.confirmPassword}
										onChangeText={handleChange(
											'confirmPassword'
										)}
										primaryColor={
											globalStyles.colorPallet.primary
										}
										placeholder='Confirm new password'
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
		paddingHorizontal: 30,
	},
	formikContainer: {
		flex: 1,
		marginTop: '15%',
	},
});

export default ResetPassword;
