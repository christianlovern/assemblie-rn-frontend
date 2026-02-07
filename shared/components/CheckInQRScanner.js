import React, { useState, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	Alert,
	Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

/**
 * Full-screen QR scanner for checkout verification.
 * Scans for a checkout token (raw string or JSON with checkoutToken).
 * @param {boolean} visible
 * @param {() => void} onClose
 * @param {(token: string) => void} onScan - called with the extracted checkout token string
 */
const CheckInQRScanner = ({ visible, onClose, onScan }) => {
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const { colors } = useTheme();

	const handleBarCodeScanned = useCallback(
		({ data }) => {
			if (scanned) return;
			setScanned(true);
			let token = data;
			let ministryIdFromUrl = null;
			if (typeof data === 'string' && data.trim()) {
				const trimmed = data.trim();
				// Deep link: assemblie://checkout?ministryId=...&token=...
				if (
					trimmed.startsWith('assemblie://checkout') ||
					(trimmed.includes('assemblie://') &&
						trimmed.includes('token='))
				) {
					const ministryMatch = trimmed.match(/ministryId=([^&]+)/);
					const tokenMatch = trimmed.match(/token=([^&]+)/);
					if (ministryMatch && tokenMatch) {
						try {
							ministryIdFromUrl = decodeURIComponent(
								ministryMatch[1].trim(),
							);
							token = decodeURIComponent(tokenMatch[1].trim());
						} catch (_) {
							ministryIdFromUrl = ministryMatch[1].trim();
							token = tokenMatch[1].trim();
						}
					}
				} else {
					try {
						const parsed = JSON.parse(trimmed);
						if (
							parsed &&
							typeof parsed.checkoutToken === 'string'
						) {
							token = parsed.checkoutToken.trim();
						}
					} catch (_) {
						token = trimmed;
					}
				}
			}
			if (token) {
				onScan(token, ministryIdFromUrl);
			}
			onClose();
		},
		[scanned, onScan, onClose],
	);

	const handleClose = useCallback(() => {
		setScanned(false);
		onClose();
	}, [onClose]);

	if (!visible) return null;

	if (!permission) {
		return (
			<Modal
				visible={visible}
				transparent
				animationType='slide'>
				<View
					style={[
						styles.container,
						{ backgroundColor: colors.background },
					]}>
					<Text style={[styles.message, { color: colors.text }]}>
						Loading camera…
					</Text>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={handleClose}>
						<Text
							style={[
								styles.closeButtonText,
								{ color: colors.primary },
							]}>
							Close
						</Text>
					</TouchableOpacity>
				</View>
			</Modal>
		);
	}

	if (!permission.granted) {
		return (
			<Modal
				visible={visible}
				transparent
				animationType='slide'>
				<View
					style={[
						styles.container,
						{ backgroundColor: colors.background },
					]}>
					<Text style={[styles.message, { color: colors.text }]}>
						Camera access is needed to scan checkout QR codes.
					</Text>
					<TouchableOpacity
						style={[
							styles.primaryButton,
							{ backgroundColor: colors.primary },
						]}
						onPress={requestPermission}>
						<Text style={styles.primaryButtonText}>
							Allow camera
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={handleClose}>
						<Text
							style={[
								styles.closeButtonText,
								{ color: colors.primary },
							]}>
							Close
						</Text>
					</TouchableOpacity>
				</View>
			</Modal>
		);
	}

	return (
		<Modal
			visible={visible}
			animationType='slide'>
			<View style={styles.cameraWrapper}>
				<CameraView
					style={StyleSheet.absoluteFillObject}
					facing='back'
					barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
					onBarcodeScanned={
						scanned ? undefined : handleBarCodeScanned
					}
				/>
				<View style={styles.overlay}>
					<Text style={styles.instruction}>
						Point the camera at the guardian's pickup QR code
					</Text>
				</View>
				<TouchableOpacity
					style={[
						styles.closeButtonAbsolute,
						{ backgroundColor: 'rgba(0,0,0,0.5)' },
					]}
					onPress={handleClose}>
					<Text style={styles.closeButtonText}>Close</Text>
				</TouchableOpacity>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	message: {
		...typography.body,
		textAlign: 'center',
		marginBottom: 24,
	},
	primaryButton: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		marginBottom: 16,
	},
	primaryButtonText: {
		...typography.bodyMedium,
		color: '#fff',
	},
	closeButton: {
		padding: 16,
	},
	closeButtonText: {
		...typography.bodyMedium,
	},
	cameraWrapper: {
		flex: 1,
		backgroundColor: '#000',
	},
	overlay: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 60 : 48,
		left: 24,
		right: 24,
		alignItems: 'center',
	},
	instruction: {
		...typography.body,
		color: '#fff',
		textAlign: 'center',
	},
	closeButtonAbsolute: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 48 : 32,
		left: 24,
		right: 24,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
});

export default CheckInQRScanner;
