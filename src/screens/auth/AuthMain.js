/**
 * Main Auth screen, displays the three options for signing in (QR, Community Pin, Username/Password)
 */

import { Text } from '@rneui/themed';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Background from '../../../shared/components/Background';
import Button from '../../../shared/buttons/Button';
import AuthHeader from './AuthHeader';
import { useTheme } from '../../../contexts/ThemeContext';

const AuthMain = ({ navigation }) => {
	const [error, setError] = useState('');
	const { colors } = useTheme();

	return (
		<Background>
			<View style={styles.container}>
				<AuthHeader
					primaryText={'Assemblie'}
					secondaryText={'Connect with your church community'}
				/>
				<View style={styles.buttonContainer}>
					<Button
						type='primary'
						text='Login'
						onPress={() => navigation.navigate('SignAuth')}
					/>
					<Button
						type='hollow'
						text='Continue as Guest'
						onPress={() => navigation.navigate('PinAuth')}
					/>
					<Button
						type='gradient'
						text='Sign Up'
						onPress={() => navigation.navigate('SignUp')}
					/>
				</View>
			</View>
		</Background>
	);
};

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 30,
	},
	buttonContainer: {
		marginTop: '20%',
	},
	text: {
		color: 'white',
		fontSize: 20,
		justifyContent: 'center',
		alignSelf: 'center',
		padding: 25,
		paddingTop: 35,
		paddingBottom: 10,
		textAlign: 'center',
	},
});

export default AuthMain;
