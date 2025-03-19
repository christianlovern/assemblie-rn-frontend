/**
 * Main Auth screen, displays the three options for signing in (QR, Community Pin, Username/Password)
 */

import { Text } from '@rneui/themed';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

const AuthHeader = ({ primaryText, secondaryText = '' }) => {
	const { colors } = useTheme();

	return (
		<View>
			<View style={styles.logoContainer}>
				<Image
					source={require('../../../assets/Assemblie_FullIcon.png')}
					style={{ width: 400, height: 400 }}
					resizeMode='contain'
				/>
			</View>
			<View>
				{secondaryText && (
					<Text
						style={[
							styles.textSecondary,
							{ color: colors.textWhite },
						]}>
						{secondaryText}
					</Text>
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
	textSecondary: {
		fontSize: 20,
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		paddingBottom: 10,
		textAlign: 'center',
	},
});

export default AuthHeader;
