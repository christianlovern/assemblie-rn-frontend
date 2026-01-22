import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const Background = ({ children }) => {
	const { colors } = useTheme();

	// Use mode-based background color (no gradient)
	const backgroundColor = colors.background || '#10192b';

	return (
		<View
			style={[
				styles.backgroundContainer,
				{ backgroundColor },
			]}>
			<View style={styles.backgroundContent}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	backgroundContainer: {
		flex: 1,
	},
	backgroundContent: {
		flex: 1,
	},
});

export default Background;
