import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../../context';
import { usersApi } from '../../../api/userRoutes';
import Background from '../../../shared/components/Background';
import { typography } from '../../../shared/styles/typography';
import { lightenColor } from '../../../shared/helper/colorFixer';
import InputWithIcon from '../../../shared/components/ImputWithIcon';

const ChangePasswordScreen = () => {
	const navigation = useNavigation();
	const { organization } = useData();
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');

	const handleChangePassword = async () => {
		try {
			setError('');

			// Validate inputs
			if (!currentPassword || !newPassword || !confirmPassword) {
				setError('All fields are required');
				return;
			}

			if (newPassword !== confirmPassword) {
				setError('New passwords do not match');
				return;
			}

			if (newPassword.length < 6) {
				setError('New password must be at least 6 characters long');
				return;
			}

			// Call API to change password
			await usersApi.changePassword(currentPassword, newPassword);

			Alert.alert('Success', 'Password changed successfully', [
				{
					text: 'OK',
					onPress: () => navigation.goBack(),
				},
			]);
		} catch (error) {
			setError(error.message || 'Failed to change password');
		}
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<Text
					style={[
						styles.title,
						{ color: organization.secondaryColor },
					]}>
					Change Password
				</Text>

				{error ? <Text style={styles.errorText}>{error}</Text> : null}

				<InputWithIcon
					inputType='password'
					value={currentPassword}
					onChangeText={setCurrentPassword}
					placeholder='Current Password'
					primaryColor={organization.secondaryColor}
				/>

				<InputWithIcon
					inputType='password'
					value={newPassword}
					onChangeText={setNewPassword}
					placeholder='New Password'
					primaryColor={organization.secondaryColor}
				/>

				<InputWithIcon
					inputType='password'
					value={confirmPassword}
					onChangeText={setConfirmPassword}
					placeholder='Confirm New Password'
					primaryColor={organization.secondaryColor}
				/>

				<TouchableOpacity
					style={[
						styles.button,
						{ backgroundColor: organization.secondaryColor },
					]}
					onPress={handleChangePassword}>
					<Text style={styles.buttonText}>Change Password</Text>
				</TouchableOpacity>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	title: {
		...typography.h2,
		marginBottom: 24,
		textAlign: 'center',
	},
	button: {
		height: 50,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 16,
	},
	buttonText: {
		...typography.body,
		color: 'white',
	},
	errorText: {
		...typography.body,
		color: 'red',
		textAlign: 'center',
		marginBottom: 16,
	},
});

export default ChangePasswordScreen;
