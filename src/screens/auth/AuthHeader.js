/**
 * Main Auth screen, displays the three options for signing in (QR, Community Pin, Username/Password)
 */

import { Text } from '@rneui/themed';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import globalStyles from '../../../shared/styles/globalStyles';

const AuthHeader = ({ primaryText, secondaryText = '' }) => {
	return (
		<View>
			<View style={styles.logoContainer}>
				<Image
					source={require('../../../assets/CongreGate_LogoLight.png')}
					style={{ width: 200, height: 200 }}
					resizeMode='contain'
				/>
			</View>
			<View>
				<Text style={styles.textPrimary}>{primaryText}</Text>
				{secondaryText && (
					<Text style={styles.textSecondary}>{secondaryText}</Text>
				)}
			</View>
		</View>
	);
};

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const styles = StyleSheet.create({
	logoContainer: {
		width: 200,
		height: 200,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		marginTop: '20%',
	},
	textPrimary: {
		color: globalStyles.colorPallet.lightPrimary,
		fontSize: 40,
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		paddingBottom: 10,
		textAlign: 'center',
	},
	textSecondary: {
		color: 'white',
		fontSize: 20,
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		paddingBottom: 10,
		textAlign: 'center',
	},
});

export default AuthHeader;
