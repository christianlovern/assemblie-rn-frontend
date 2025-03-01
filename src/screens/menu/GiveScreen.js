import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const TithelyGivingScreen = () => {
	return (
		<View style={styles.container}>
			<WebView
				source={{
					uri: 'https://tithe.ly/give?c=6e0a2931-99ef-435e-91fd-c12a1dd75143',
				}}
				style={styles.webview}
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
});

export default TithelyGivingScreen;
