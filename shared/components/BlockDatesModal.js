import React, { useState } from 'react';
import {
	Modal,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const BlockDatesModal = ({ visible, onClose, onConfirm, teams }) => {
	const { organization } = useData();
	const { colors } = useTheme();
	const [teamId, setTeamId] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [reason, setReason] = useState('');

	const handleConfirm = () => {
		// Validate dates
		if (!startDate || !endDate) {
			Alert.alert('Error', 'Please select both start and end dates');
			return;
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
			Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format');
			return;
		}

		// Validate start date <= end date
		if (new Date(startDate) > new Date(endDate)) {
			Alert.alert('Error', 'Start date must be before or equal to end date');
			return;
		}

		// Validate team selection if teams exist
		if (teams && teams.length > 0 && !teamId) {
			Alert.alert('Error', 'Please select a team');
			return;
		}

		const data = {
			startDate,
			endDate,
		};

		if (teamId) {
			data.teamId = parseInt(teamId);
		}

		if (reason.trim()) {
			data.reason = reason.trim();
		}

		onConfirm(data);
	};

	const handleClose = () => {
		setTeamId('');
		setStartDate('');
		setEndDate('');
		setReason('');
		onClose();
	};

	// Get today's date in YYYY-MM-DD format
	const getTodayDate = () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
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
						Block Unavailable Dates
					</Text>

					<ScrollView style={styles.scrollContent}>
						{/* Team Selection */}
						{teams && teams.length > 0 && (
							<View style={styles.inputContainer}>
								<Text style={[styles.label, { color: colors.textWhite || '#FFFFFF' }]}>
									Team
								</Text>
								<View
									style={[
										styles.pickerContainer,
										{
											backgroundColor: 'rgba(255, 255, 255, 0.2)',
											borderColor: 'rgba(255, 255, 255, 0.3)',
										},
									]}>
									<Picker
										selectedValue={teamId}
										onValueChange={setTeamId}
										style={[styles.picker, { color: colors.textWhite || '#FFFFFF' }]}
										dropdownIconColor={colors.textWhite || '#FFFFFF'}>
										<Picker.Item label="Select a team" value="" />
										{teams.map((team) => (
											<Picker.Item
												key={team.id}
												label={team.name}
												value={team.id.toString()}
											/>
										))}
									</Picker>
								</View>
							</View>
						)}

						{/* Start Date */}
						<View style={styles.inputContainer}>
							<Text style={[styles.label, { color: colors.textWhite || '#FFFFFF' }]}>
								Start Date (YYYY-MM-DD)
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
								placeholder="2026-02-20"
								placeholderTextColor="rgba(255, 255, 255, 0.6)"
								value={startDate}
								onChangeText={setStartDate}
							/>
						</View>

						{/* End Date */}
						<View style={styles.inputContainer}>
							<Text style={[styles.label, { color: colors.textWhite || '#FFFFFF' }]}>
								End Date (YYYY-MM-DD)
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
								placeholder="2026-02-25"
								placeholderTextColor="rgba(255, 255, 255, 0.6)"
								value={endDate}
								onChangeText={setEndDate}
							/>
						</View>

						{/* Reason */}
						<View style={styles.inputContainer}>
							<Text style={[styles.label, { color: colors.textWhite || '#FFFFFF' }]}>
								Reason (optional)
							</Text>
							<TextInput
								style={[
									styles.input,
									styles.textArea,
									{
										backgroundColor: 'rgba(255, 255, 255, 0.2)',
										color: colors.textWhite || '#FFFFFF',
										borderColor: 'rgba(255, 255, 255, 0.3)',
									},
								]}
								placeholder="Reason for unavailability..."
								placeholderTextColor="rgba(255, 255, 255, 0.6)"
								value={reason}
								onChangeText={setReason}
								multiline
								numberOfLines={3}
								textAlignVertical="top"
							/>
						</View>
					</ScrollView>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton]}
							onPress={handleClose}>
							<Text style={styles.buttonText}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.button, styles.confirmButton]}
							onPress={handleConfirm}>
							<Text style={styles.buttonText}>Block Dates</Text>
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
		width: '90%',
		maxHeight: '80%',
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
		marginBottom: 20,
		textAlign: 'center',
		fontWeight: '600',
	},
	scrollContent: {
		maxHeight: 400,
	},
	inputContainer: {
		marginBottom: 20,
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
		fontSize: 14,
		...typography.body,
	},
	textArea: {
		minHeight: 80,
	},
	pickerContainer: {
		borderWidth: 1,
		borderRadius: 10,
		overflow: 'hidden',
	},
	picker: {
		height: 50,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		marginTop: 20,
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
	confirmButton: {
		backgroundColor: '#1890ff',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
});

export default BlockDatesModal;
