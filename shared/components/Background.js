import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Background = ({
	primaryColor = '#332E82',
	secondaryColor = '#791951',
	children,
}) => {
	return (
		<LinearGradient
			colors={[primaryColor, secondaryColor]}
			style={styles.gradient}>
			<View style={styles.content}>{children}</View>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
});

export default Background;
