import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';

const SettingsScreen = () => {
	const { user, organization } = useData();
	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<Text style={styles.text}>This is the Settings screen</Text>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center', // Center vertically
		alignItems: 'center', // Center horizontally
	},
	text: {
		fontSize: 20,
		fontWeight: 'bold',
	},
});

export default SettingsScreen;
