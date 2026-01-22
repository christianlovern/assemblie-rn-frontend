import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../shared/styles/typography';

const TithelyGivingScreen = () => {
	const { organization } = useData();
	const { colors } = useTheme();

	// Check if organization and giveUrl are available
	if (!organization) {
		return (
			<View style={[styles.container, styles.centerContent]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={[styles.message, { color: colors.text }]}>
					Loading...
				</Text>
			</View>
		);
	}

	if (!organization.giveUrl || typeof organization.giveUrl !== 'string') {
		return (
			<View style={[styles.container, styles.centerContent]}>
				<Text style={[styles.message, { color: colors.text }]}>
					No giving URL configured for this organization.
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<WebView
				source={{
					uri: organization.giveUrl,
				}}
				style={styles.webview}
				onError={(syntheticEvent) => {
					const { nativeEvent } = syntheticEvent;
					console.warn('WebView error: ', nativeEvent);
				}}
				startInLoadingState={true}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	webview: {
		flex: 1,
	},
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	message: {
		...typography.body,
		textAlign: 'center',
		marginTop: 20,
	},
});

export default TithelyGivingScreen;
