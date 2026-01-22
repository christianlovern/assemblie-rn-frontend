import React, { useState, useEffect } from 'react';
import {
	Dimensions,
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
	Linking,
	Text,
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
import { announcementsApi, eventsApi } from '../../../api/announcementRoutes';
import { ministryApi } from '../../../api/ministryRoutes';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const PinAuth = () => {
	const {
		auth,
		setAuth,
		user,
		setUser,
		setOrganization,
		setUserAndToken,
		setAnnouncements,
		setEvents,
		setMinistries,
		setFamilyMembers,
		setSelectedMinistry,
		setTeams,
	} = useData();
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
					let userData = res.data.user;
					userData.isGuest = true;
					setUser(userData);
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
			setError('Guest PIN is required');
			return;
		}

		setIsLoading(true);
		try {
			const res = await signInGuest({ orgPin: values.orgPin });

			if (res.status === 200 && res.data.user) {
				const userData = {
					...res.data.user,
					isGuest: true,
				};
				const token = res.data.token;

				await setUserAndToken(userData, token);
				setOrganization(userData.organization);

				// Initialize empty arrays for guest users
				setTeams([]);
				setFamilyMembers({
					activeConnections: [],
					pendingConnections: [],
				});

				// Set auth state to trigger navigation to main app flow
				setAuth(true);
			} else {
				setError(res.data.message || 'Invalid guest PIN');
			}
		} catch (error) {
			console.error('Guest sign in failed:', error);
			setError('Unable to connect to the server. Please try again.');
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
							orgPin: '',
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
								{error && (
									<Text style={[styles.errorText]}>
										{error}
									</Text>
								)}
								<View style={{ marginBottom: 20 }}>
									<InputWithIcon
										inputType='pin'
										value={values.orgPin}
										onChangeText={handleChange('orgPin')}
										primaryColor={colors.buttons?.primary?.background || colors.primary}
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
	errorText: {
		color: '#a44c62',
		fontSize: 16,
		marginBottom: 10,
	},
});

export default PinAuth;
