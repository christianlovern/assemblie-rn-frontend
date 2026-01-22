import React, { useState } from 'react';
import {
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { Formik } from 'formik';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import * as userRoutes from '../../../api/userRoutes';
const ResetPassword = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { email, code } = route.params;
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { colors } = useTheme();

	const handleResetPassword = async (values) => {
		if (values.password !== values.confirmPassword) {
			setError('passwordMismatch');
			return;
		}

		setIsLoading(true);
		try {
			// Ensure email is lowercase (in case it wasn't normalized earlier)
			const normalizedEmail = email?.toLowerCase().trim() || email;
			const response = await userRoutes.resetPassword(
				normalizedEmail,
				code,
				values.password
			);

			if (!response.ok) {
				throw new Error('Failed to reset password');
			}

			navigation.navigate('AuthMain');	// navigate to the main auth screen
		} catch (error) {
			setError('resetFailed');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Background>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={styles.scrollContainer}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'>
					<View style={styles.contentContainer}>
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
												onChangeText={handleChange(
													'password'
												)}
												primaryColor={colors.buttons?.primary?.background || colors.primary}
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
												primaryColor={colors.buttons?.primary?.background || colors.primary}
												placeholder='Confirm new password'
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
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Background>
	);
};

const styles = StyleSheet.create({
	contentContainer: {
		paddingHorizontal: 30,
		paddingBottom: 40,
		height: 600,
	},
	scrollContainer: {
		flexGrow: 1,
	},
	formikContainer: {
		marginTop: '15%',
	},
});

export default ResetPassword;
