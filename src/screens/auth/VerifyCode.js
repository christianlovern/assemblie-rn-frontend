import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Formik } from 'formik';
import { useNavigation, useRoute } from '@react-navigation/native';
import globalStyles from '../../../shared/styles/globalStyles';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';

const VerifyCode = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { email } = route.params;
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleVerifyCode = async (values) => {
		if (!values.code) {
			setError('missingCode');
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch('YOUR_API_ENDPOINT/verify-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					code: values.code,
				}),
			});

			if (!response.ok) {
				throw new Error('Invalid code');
			}

			navigation.navigate('ResetPassword', { email, code: values.code });
		} catch (error) {
			setError('invalidCode');
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
					primaryText={'Enter Verification Code'}
					secondaryText={'Enter the code sent to your email'}
				/>
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{ code: '' }}
						onSubmit={handleVerifyCode}>
						{({ values, handleSubmit, handleChange }) => (
							<>
								<View style={{ marginBottom: 20 }}>
									<InputWithIcon
										inputType='numeric'
										value={values.code}
										onChangeText={handleChange('code')}
										primaryColor={
											globalStyles.colorPallet.primary
										}
										placeholder='Enter verification code'
									/>
								</View>
								<Button
									type='gradient'
									text='Verify Code'
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

export default VerifyCode;
