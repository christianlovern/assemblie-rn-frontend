import React, { useState } from 'react';
import {
	Dimensions,
	Image,
	StyleSheet,
	TextInput,
	View,
	Text,
	Pressable,
} from 'react-native';
import { Formik } from 'formik';
// import AuthModal from '../../shared/modal/AuthModal';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import globalStyles from '../../../shared/styles/globalStyles';
import { signInUser } from '../../../api/userRoutes';
import { useData } from '../../../context';
import { ImageBackground } from 'react-native';
import Background from '../../../shared/components/Background';
import AuthHeader from './AuthHeader';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import { announcementsApi, eventsApi } from '../../../api/announcementRoutes';
import { familyMembersApi } from '../../../api/familyMemberRoutes';
import { ministryApi } from '../../../api/ministryRoutes';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const SignAuth = () => {
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const {
		auth,
		setAuth,
		user,
		setUser,
		setOrganization,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setSelectedMinistry,
	} = useData();

	const handleOnPress = async (values) => {
		if (!values.email || !values.password) {
			setError('missingValue');
			return;
		}

		try {
			let res = await signInUser(values);
			if (res.status == 200) {
				setUser(res.data.user);
				setOrganization(res.data.user.organization);

				try {
					// Fetch all data in parallel
					const [
						announcementsData,
						eventsData,
						familyMembersData,
						ministriesData,
					] = await Promise.all([
						announcementsApi.getAll(res.data.user.organization.id),
						eventsApi.getAll(res.data.user.organization.id),
						familyMembersApi.getAll(),
						ministryApi.getAllForOrganization(
							res.data.user.organization.id
						),
					]);

					setAnnouncements({
						announcements: announcementsData.announcements || [],
					});
					setEvents({ events: eventsData.events || [] });
					setFamilyMembers(familyMembersData || []);
					setMinistries(ministriesData || []);
					setSelectedMinistry(ministriesData[0]);
				} catch (error) {
					console.error('Failed to fetch data:', error);
				}

				setAuth(!auth);
			}
		} catch (error) {
			console.error('Login failed:', error);
			setError('loginFailed');
		}
	};

	const toggleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	return (
		<Background>
			<View style={styles.screenContainer}>
				<AuthHeader primaryText={'Welcome Back'} />
				<View style={styles.formikContainer}>
					<Formik
						initialValues={{
							// email: '',
							// password: '',
							email: 'clovern.assemblie@gmail.com',
							password: 'Christian1!',
						}}
						onSubmit={(values) => {
							handleOnPress(values);
						}}>
						{({
							values,
							handleSubmit,
							handleChange,
							setFieldTouched,
						}) => (
							<>
								<InputWithIcon
									inputType='email'
									value={values.email}
									onChangeText={handleChange('email')}
									primaryColor={
										globalStyles.colorPallet.primary
									}
								/>
								<InputWithIcon
									inputType='password'
									value={values.password}
									onChangeText={handleChange('password')}
									primaryColor={
										globalStyles.colorPallet.primary
									}
								/>

								<Pressable
									style={({ pressed }) => [
										pressed ? { opacity: 0.6 } : {},
									]}
									onPress={() =>
										navigation.navigate('ForgotPassword')
									}>
									<Text style={styles.textAlt}>
										{'Forgot Password'}
									</Text>
								</Pressable>
								<Button
									type='gradient'
									text='Sign In'
									onPress={() => {
										handleSubmit();
									}}
								/>
							</>
						)}
					</Formik>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		// justifyContent: 'center',
		paddingBottom: screenHeight / 10,
		paddingHorizontal: 30,
	},
	formikContainer: {
		flex: 1,
		marginTop: '20%',
	},
	textAlt: {
		color: globalStyles.colorPallet.lightPrimary,
		fontSize: 18,
		alignSelf: 'flex-end',
		marginBottom: 20,
	},
});
export default SignAuth;
