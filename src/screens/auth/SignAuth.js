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

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const SignAuth = () => {
	const navigation = useNavigation();
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const { auth, setAuth, user, setUser, setOrganization } = useData();

	const handleOnPress = async (values) => {
		if (!values.email || !values.password) {
			setError('missingValue');
			return;
		}
		console.log('INSIDE OF SIGNAUTH', values);
		let res = await signInUser(values);
		if (res.status == 200) {
			console.log(res.data.user);
			setUser(res.data.user);
			setOrganization(res.data.user.organization);
			setAuth(!auth);
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
							email: 'tester-user@yahoo.com',
							password: 'password2',
						}}
						onSubmit={(values) => handleOnPress(values)}>
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
									onChangeText={() => handleChange('email')}
									primaryColor={
										globalStyles.colorPallet.primary
									}
								/>
								<InputWithIcon
									inputType='password'
									value={values.password}
									onChangeText={() =>
										handleChange('password')
									}
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
									onPress={handleSubmit}
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
