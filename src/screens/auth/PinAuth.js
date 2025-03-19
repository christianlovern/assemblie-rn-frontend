import React, { useState, useEffect } from 'react';
import {
	Dimensions,
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
	Linking,
} from 'react-native';
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { signInGuest } from '../../../api/userRoutes';
import { useData } from '../../../context';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const PinAuth = () => {
	const { auth, setAuth, user, setUser, setOrganization } = useData();
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { colors } = useTheme();

	useEffect(() => {
		// Handle deep link when component mounts
		const handleDeepLink = async ({ url }) => {
			const orgPin = url.split('orgPin=')[1];
			if (orgPin) {
				const res = await signInGuest({ orgPin });
				if (res.status == 200) {
					setUser(res.data.user);
					setOrganization(res.data.user.organization);
					setAuth(!auth);
				}
			}
		};

		// Check for initial URL when app opens from deep link
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleDeepLink({ url });
			}
		});

		// Listen for deep link events while app is running
		const linkingSubscription = Linking.addEventListener(
			'url',
			handleDeepLink
		);

		return () => {
			linkingSubscription.remove();
		};
	}, []);

	const handleOnPress = async (values) => {
		if (!values.orgPin) {
			setError('missingValue');
			return;
		}

		setIsLoading(true);
		try {
			const res = await signInGuest(values);
			if (res.status == 200) {
				setUser(res.data.user);
				setOrganization(res.data.user.organization);
				setAuth(!auth);
			}
		} catch (error) {
			console.error('Guest sign in failed:', error);
			setError('signInFailed');
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
				<AuthHeader
					primaryText={'Welcome'}
					secondaryText={
						'Please enter the Guest PIN provided by your Church'
					}
				/>
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{
							orgPin: '12345',
						}}
						onSubmit={(values) => handleOnPress(values)}>
						{({
							values,
							handleSubmit,
							handleChange,
							setFieldTouched,
							isValid,
						}) => (
							<>
								<View style={{ marginBottom: 20 }}>
									<InputWithIcon
										inputType='pin'
										value={values.orgPin}
										onChangeText={handleChange('orgPin')}
										primaryColor={colors.primary}
									/>
								</View>
								<Button
									type='gradient'
									text='Sign In'
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

export default PinAuth;
