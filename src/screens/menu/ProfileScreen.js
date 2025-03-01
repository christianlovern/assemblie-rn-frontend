import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';

const ProfileScreen = () => {
	const { user, organization } = useData();

	const userData = {
		firstName: user.firstName ? user.firstName : '',
		lastName: user.lastName ? user.lastName : '',
		email: user.email ? user.email : '',
		phone: user.phoneNumber ? user.phoneNumber : '',
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<View
					style={{
						marginTop: '15%',
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<Image
						source={require('../../../assets/dummy-org-logo.jpg')}
						style={styles.userIcon}
					/>
					<View
						style={{
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Text style={styles.subHeaderText}>
							{'Tap to change profile photo'}
						</Text>
					</View>
				</View>
				<View
					style={{
						marginTop: 20,
						width: '85%',
					}}>
					<InputWithIcon
						inputType='user-first'
						value={userData.firstName}
						onChangeText={() => {
							userData.firstName = value;
						}}
						primaryColor={organization.primaryColor}
					/>
					<InputWithIcon
						inputType='user-last'
						value={userData.lastName}
						onChangeText={() => {
							userData.lastName = value;
						}}
						primaryColor={organization.primaryColor}
					/>
					<InputWithIcon
						inputType='email'
						value={userData.email}
						onChangeText={() => {
							userData.email = value;
						}}
						primaryColor={organization.primaryColor}
					/>
					<Button
						type='gradient'
						text='Save Changes'
						primaryColor={organization.primaryColor}
						secondaryColor={organization.secondaryColor}
						onPress={() =>
							console.log('USER DATA ON SUBMIT', userData)
						}
					/>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: '10%',
		alignItems: 'center',
	},
	text: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	headerText: {
		fontSize: 22,
		color: 'white',
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
	},
	subHeaderText: {
		fontSize: 18,
		color: 'white',
		justifyContent: 'center',
		alignSelf: 'center',
		marginTop: '2%',
	},
	userIcon: {
		width: 150,
		height: 150,
		resizeMode: 'contain',
		marginRight: 10,
		borderRadius: 50,
	},
});

export default ProfileScreen;
