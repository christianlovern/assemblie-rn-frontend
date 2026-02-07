import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

/**
 * Generic QR code display. Encodes a string or object as the QR payload.
 * Uses react-native-qrcode-svg so the QR renders correctly in React Native.
 * @param {string|object} payload - String to encode as-is, or object (e.g. { checkoutToken: "..." }) to JSON.stringify
 * @param {number} size - Width/height (default 200)
 * @param {object} style - Container style
 * @param {string} color - QR color (default '#000000')
 * @param {string} backgroundColor - Background color (default '#FFFFFF')
 */
const QRCodeDisplay = ({
	payload,
	size = 200,
	style,
	color = '#000000',
	backgroundColor = '#FFFFFF',
}) => {
	if (payload === undefined || payload === null || payload === '') {
		return <View style={[styles.container, styles.placeholder, { width: size, height: size }, style]} />;
	}
	const value = typeof payload === 'string' ? payload : JSON.stringify(payload);

	return (
		<View style={[styles.container, style]}>
			<QRCode
				value={value}
				size={size}
				color={color}
				backgroundColor={backgroundColor}
				quietZone={8}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 120,
	},
	placeholder: {
		backgroundColor: 'rgba(0,0,0,0.1)',
	},
});

export default QRCodeDisplay;
