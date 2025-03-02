import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const TithelyGivingScreen = () => {
	return (
		<View style={styles.container}>
			<WebView
				source={{
					uri: 'https://give.tithe.ly/?formId=68017320-5d42-11ee-90fc-1260ab546d11',
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
