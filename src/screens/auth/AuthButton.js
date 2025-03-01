/**
 * Button to handle the logic to navigate to the Username/Password flow for authentication
 */

import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import globalStyles from '../../../shared/styles/globalStyles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

export default function AuthButton({ text, type }) {
	const navigation = useNavigation();
	let onPress;
	if (type == 'user') {
		// navigate to the login screen
		onPress = () => navigation.navigate('SignAuth');
	} else if (type == 'guest') {
		// navigate to the pin screen
		onPress = () => navigation.navigate('PinAuth');
	} else if (type == 'signUp') {
		// navigate to the pin screen
		onPress = () => navigation.navigate('SignUp');
	}

	return (
		<Pressable
			style={({ pressed }) => [pressed ? { opacity: 0.6 } : {}]}
			onPress={onPress}>
			<View style={styles.authButton}>
				<View style={{ width: '25%', alignItems: 'flex-end' }}>
					{type == 'user' && (
						<Icon
							name='person'
							size={40}
							color={globalStyles.colorPallet.accentText}
						/>
					)}
					{type == 'guest' && (
						<Icon
							name='pin'
							size={40}
							color={globalStyles.colorPallet.accentText}
						/>
					)}
					{type == 'signUp' && (
						<Icon
							name='person-add'
							size={40}
							color={globalStyles.colorPallet.accentText}
						/>
					)}
				</View>
				<View style={{ width: '50%' }}>
					<Text style={styles.text}>{text}</Text>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	authButton: {
		flexDirection: 'row',
		borderRadius: 15,
		backgroundColor: '#FFFFFF99',
		width: '65%',
		borderWidth: 1,
		borderColor: '#666563',
		paddingTop: 5,
		paddingBottom: 5,
		// justifyContent: "center",
		alignItems: 'center',
		alignSelf: 'center',
		marginBottom: 20,
	},
	text: {
		color: globalStyles.colorPallet.accentText,
		fontSize: 20,
		justifyContent: 'center',
		alignSelf: 'center',
		textAlign: 'center',
		alignItems: 'center', //Centered horizontally
	},
});
