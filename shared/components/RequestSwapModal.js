import React, { useState } from 'react';
import {
	Modal,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const RequestSwapModal = ({ visible, onClose, onConfirm, schedule }) => {
	const { organization } = useData();
	const { colors } = useTheme();
	const [swapReason, setSwapReason] = useState('');

	const handleConfirm = () => {
		onConfirm(swapReason);
		setSwapReason('');
	};

	const handleClose = () => {
		setSwapReason('');
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType='fade'
			onRequestClose={handleClose}>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.modalContent,
						{
							backgroundColor:
								organization?.primaryColor || colors.primary || '#1E1E1E',
						},
					]}>
					<Text style={[styles.title, { color: colors.textWhite || '#FFFFFF' }]}>
						Request Swap
					</Text>
					<Text style={[styles.message, { color: colors.textWhite || '#FFFFFF' }]}>
						Request a swap for this schedule. Other team members will be able to see and accept your request.
					</Text>
					
					<Text style={[styles.label, { color: colors.textWhite || '#FFFFFF' }]}>
						Reason (optional)
					</Text>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								color: colors.textWhite || '#FFFFFF',
								borderColor: 'rgba(255, 255, 255, 0.3)',
							},
						]}
						placeholder="Reason for requesting swap..."
						placeholderTextColor="rgba(255, 255, 255, 0.6)"
						value={swapReason}
						onChangeText={setSwapReason}
						multiline
						numberOfLines={4}
						textAlignVertical="top"
					/>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton]}
							onPress={handleClose}>
							<Text style={styles.buttonText}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.button, styles.swapButton]}
							onPress={handleConfirm}>
							<Text style={styles.buttonText}>Request Swap</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '85%',
		padding: 24,
		borderRadius: 16,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	title: {
		...typography.h2,
		marginBottom: 16,
		textAlign: 'center',
		fontWeight: '600',
	},
	message: {
		...typography.body,
		marginBottom: 20,
		textAlign: 'center',
		lineHeight: 24,
	},
	label: {
		...typography.body,
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 10,
		padding: 12,
		marginBottom: 24,
		minHeight: 100,
		fontSize: 14,
		...typography.body,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	button: {
		flex: 1,
		padding: 14,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1.41,
	},
	cancelButton: {
		backgroundColor: '#757575',
	},
	swapButton: {
		backgroundColor: '#1890ff',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
});

export default RequestSwapModal;
