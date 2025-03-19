import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const Background = ({ children }) => {
	const { colors } = useTheme();

	// Get colors from theme backgrounds
	const from = colors.backgrounds?.main?.from || '#332E82';
	const to = colors.backgrounds?.main?.to || '#791951';

	return (
		<LinearGradient
			colors={[from, to]}
			style={styles.backgroundGradient}>
			<View style={styles.backgroundContent}>{children}</View>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	backgroundGradient: {
		flex: 1,
	},
	backgroundContent: {
		flex: 1,
	},
});

export default Background;
