import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography } from '../styles/typography';

const DeleteConfirmationModal = ({
	visible,
	onClose,
	onConfirm,
	message,
	colors,
	isLoading,
	organization,
}) => {
	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType='fade'
			onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.modalContent,
						{
							backgroundColor:
								organization?.primaryColor || '#1E1E1E',
						},
					]}>
					<Text style={[styles.title, { color: colors.textWhite }]}>
						Confirm Delete
					</Text>
					<Text style={[styles.message, { color: colors.textWhite }]}>
						{message}
					</Text>
					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton]}
							onPress={onClose}
							disabled={isLoading}>
							<Text style={styles.buttonText}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.button, styles.deleteButton]}
							onPress={onConfirm}
							disabled={isLoading}>
							<Text style={styles.buttonText}>
								{isLoading ? 'Deleting...' : 'Delete'}
							</Text>
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
		marginBottom: 24,
		textAlign: 'center',
		lineHeight: 24,
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
	deleteButton: {
		backgroundColor: '#F44336',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
});

export default DeleteConfirmationModal;
