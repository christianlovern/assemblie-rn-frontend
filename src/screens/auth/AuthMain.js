import React, { useState } from 'react';
import {
	Dimensions,
	Image,
	StyleSheet,
	View,
	Text,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	TouchableOpacity,
} from 'react-native';
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import { signInUser, signInGuest } from '../../../api/userRoutes';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import { typography } from '../../../shared/styles/typography';
import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../../utils/notificationUtils';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const AuthMain = () => {
	const navigation = useNavigation();
	const { colors, updateTheme, toggleColorMode, colorMode } = useTheme();
	const [authType, setAuthType] = useState('member'); // 'member' or 'guest'
	const [error, setError] = useState({
		email: '',
		password: '',
		orgPin: '',
		general: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const {
		auth,
		setAuth,
		setOrganization,
		setUserAndToken,
		setTeams,
		setFamilyMembers,
	} = useData();

	// Member login handler
	const handleMemberLogin = async (values) => {
		// Reset error states
		setError({ email: '', password: '', orgPin: '', general: '' });

		if (!values.email && !values.password) {
			setError((prev) => ({
				...prev,
				email: 'Email is required',
				password: 'Password is required',
			}));
			return;
		}
		if (!values.email) {
			setError((prev) => ({ ...prev, email: 'Email is required' }));
			return;
		}
		if (!values.password) {
			setError((prev) => ({
				...prev,
				password: 'Password is required',
			}));
			return;
		}

		setIsLoading(true);
		try {
			console.log('values', values);
			// Convert email to lowercase before sending to backend
			const normalizedValues = {
				...values,
				email: values.email.toLowerCase().trim(),
			};
			let res = await signInUser(normalizedValues);
			console.log('res signInUser', res);
			if (res.status == 200) {
				const userData = res.data.user;
				const orgData = userData.organization;
				const token = res.data.token;

				console.log('User Data:', userData);
				console.log('Organization Data:', orgData);
				console.log('Token:', token);

				await setUserAndToken(userData, token);

				// Set auth state to trigger MainStack
				setAuth(true);
			} else {
				console.log('res signInUser error', res);
				setError((prev) => ({
					...prev,
					general: 'Invalid email or password',
				}));
			}
		} catch (error) {
			console.log('ERROR', error);
			if (error.response?.data?.errors?.email) {
				setError((prev) => ({
					...prev,
					email: error.response.data.errors.email,
				}));
			} else {
				setError((prev) => ({
					...prev,
					email: 'An error occurred during login',
				}));
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Guest login handler
	const handleGuestLogin = async (values) => {
		setError({ email: '', password: '', orgPin: '', general: '' });

		if (!values.orgPin?.trim()) {
			setError((prev) => ({
				...prev,
				orgPin: 'Organization PIN is required',
			}));
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

				// Initialize empty arrays for guest users
				setTeams([]);
				setFamilyMembers({
					activeConnections: [],
					pendingConnections: [],
				});

				setAuth(true);
			} else {
				setError((prev) => ({
					...prev,
					orgPin: res.data.message || 'Invalid guest PIN',
				}));
			}
		} catch (error) {
			console.error('Guest sign in failed:', error);
			setError((prev) => ({
				...prev,
				general: 'Unable to connect to the server. Please try again.',
			}));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Background>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}>
					{/* Graphic Section - Top 40% */}
					<View style={styles.graphicContainer}>
						<Image
							source={require('../../../assets/Auth_Cover.jpg')}
							style={styles.graphicImage}
							resizeMode="cover"
						/>
						<View style={styles.graphicOverlay}>
							<TouchableOpacity
								onPress={toggleColorMode}
								style={styles.themeToggleButton}>
								<Icon
									name={
										colorMode === 'light'
											? 'moon-waxing-crescent'
											: 'white-balance-sunny'
									}
									size={24}
									color="#FFFFFF"
								/>
							</TouchableOpacity>
							<Text style={[styles.graphicHeader, { color: 'white' }]}>
								Stay Connected To THE Church
							</Text>
							<Text style={[styles.graphicSubtext, { color: 'white' }]}>
								Sign in to view events, announcements, and more!
							</Text>
						</View>
					</View>

					{/* Welcome Section */}
					<View style={styles.welcomeSection}>
						<Text style={[styles.welcomeHeader, { color: colors.text }]}>
							Welcome to Assemblie
						</Text>
						<Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
							Connecting Churches, one brick at a time
						</Text>
					</View>

					{/* Toggle Section */}
					<View style={styles.toggleContainer}>
						<Pressable
							style={[
								styles.toggleOption,
								authType === 'member' && {
									backgroundColor: colors.buttons?.primary?.background || colors.primary,
								},
							]}
							onPress={() => setAuthType('member')}>
							<Text
								style={[
									styles.toggleText,
									{
										color:
											authType === 'member'
												? 'white'
												: colors.textSecondary,
									},
								]}>
								Member Login
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.toggleOption,
								authType === 'guest' && {
									backgroundColor: colors.buttons?.primary?.background || colors.primary,
								},
							]}
							onPress={() => setAuthType('guest')}>
							<Text
								style={[
									styles.toggleText,
									{
										color:
											authType === 'guest'
												? 'white'
												: colors.textSecondary,
									},
								]}>
								Guest Login
							</Text>
						</Pressable>
					</View>

					{/* Form Section */}
					<View style={styles.formSection}>
						{authType === 'member' ? (
							<Formik
								initialValues={{
									email: '',
									password: '',
								}}
								onSubmit={handleMemberLogin}>
								{({ handleSubmit, handleChange, values }) => (
									<>
										{error.general && (
											<Text style={styles.errorText}>
												{error.general}
											</Text>
										)}
										<InputWithIcon
											inputType="email"
											value={values.email}
											onChangeText={(text) => {
												handleChange('email')(text);
												setError((prev) => ({
													...prev,
													email: '',
													general: '',
												}));
											}}
											primaryColor={colors.buttons?.primary?.background || colors.primary}
										/>
										{error.email ? (
											<Text style={styles.errorText}>
												{error.email}
											</Text>
										) : null}
										<InputWithIcon
											inputType="password"
											value={values.password}
											onChangeText={(text) => {
												handleChange('password')(text);
												setError((prev) => ({
													...prev,
													password: '',
													general: '',
												}));
											}}
											primaryColor={colors.buttons?.primary?.background || colors.primary}
										/>
										{error.password ? (
											<Text style={styles.errorText}>
												{error.password}
											</Text>
										) : null}
										<Pressable
											style={({ pressed }) => [
												pressed && { opacity: 0.6 },
											]}
											onPress={() =>
												navigation.navigate('ForgotPassword')
											}>
											<Text
											style={[
												styles.forgotPasswordText,
												{ color: colors.text },
											]}>
											Forgot Password?
										</Text>
										</Pressable>
										<Button
											type="primary"
											text="Sign In"
											loading={isLoading}
											onPress={handleSubmit}
										/>
										<Button
											type="hollow"
											text="Create Account"
											onPress={() =>
												navigation.navigate('SignUp')
											}
										/>
									</>
								)}
							</Formik>
						) : (
							<Formik
								initialValues={{
									orgPin: '',
								}}
								onSubmit={handleGuestLogin}>
								{({ handleSubmit, handleChange, values }) => (
									<>
										<Text style={[styles.guestHeader, { color: colors.text }]}>
											Enter Organization PIN
										</Text>
										<Text style={[styles.guestSubtext, { color: colors.textSecondary }]}>
											Enter the 4-digit PIN provided by your
											organization to view their page
										</Text>
										{error.general && (
											<Text style={styles.errorText}>
												{error.general}
											</Text>
										)}
										<InputWithIcon
											inputType="pin"
											value={values.orgPin}
											onChangeText={(text) => {
												handleChange('orgPin')(text);
												setError((prev) => ({
													...prev,
													orgPin: '',
													general: '',
												}));
											}}
											primaryColor={colors.buttons?.primary?.background || colors.primary}
										/>
										{error.orgPin ? (
											<Text style={styles.errorText}>
												{error.orgPin}
											</Text>
										) : null}
										<Button
											type="primary"
											text="Continue as Guest"
											loading={isLoading}
											onPress={handleSubmit}
										/>
									</>
								)}
							</Formik>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 30,
	},
	graphicContainer: {
		width: '100%',
		height: screenHeight * 0.3,
		position: 'relative',
	},
	graphicImage: {
		width: '100%',
		height: '100%',
	},
	graphicOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 30,
	},
	themeToggleButton: {
		position: 'absolute',
		top: 20,
		right: 20,
		padding: 8,
		zIndex: 10,
	},
	graphicHeader: {
		...typography.h1,
		textAlign: 'center',
		marginBottom: 10,
		fontSize: 28,
	},
	graphicSubtext: {
		...typography.body,
		textAlign: 'center',
		fontSize: 14,
	},
	welcomeSection: {
		paddingHorizontal: 30,
		paddingTop: 30,
		paddingBottom: 20,
		alignItems: 'center',
	},
	welcomeHeader: {
		...typography.h2,
		textAlign: 'center',
		marginBottom: 8,
	},
	welcomeSubtext: {
		...typography.body,
		textAlign: 'center',
		fontSize: 14,
	},
	toggleContainer: {
		flexDirection: 'row',
		marginHorizontal: 30,
		marginBottom: 30,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 12,
		padding: 4,
	},
	toggleOption: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	toggleText: {
		...typography.bodyMedium,
		fontSize: 16,
		fontWeight: '600',
	},
	formSection: {
		paddingHorizontal: 30,
	},
	guestHeader: {
		...typography.h3,
		textAlign: 'center',
		marginBottom: 8,
	},
	guestSubtext: {
		...typography.body,
		textAlign: 'center',
		fontSize: 14,
		marginBottom: 20,
	},
	forgotPasswordText: {
		...typography.body,
		fontSize: 14,
		textAlign: 'right',
		marginBottom: 15,
		marginTop: -10,
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

export default AuthMain;
