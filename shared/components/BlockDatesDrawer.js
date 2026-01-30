import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	ScrollView,
	Modal,
	Pressable,
	TouchableOpacity,
	Dimensions,
	Alert,
	TextInput,
	Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';
import Button from '../buttons/Button';
import { lightenColor } from '../helper/colorFixer';

const BlockDatesDrawer = ({ visible, onRequestClose, onConfirm }) => {
	const { organization } = useData();
	const { colors, colorMode, organization: orgData } = useTheme();
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [reason, setReason] = useState('');
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const primaryColor = orgData?.primaryColor || colors.primary;

	// Format date to YYYY-MM-DD
	const formatDate = (date) => {
		if (!date) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	useEffect(() => {
		if (visible) {
			// Reset to starting position first (off screen)
			slideAnim.setValue(0);
			backdropOpacity.setValue(0);
			// Use requestAnimationFrame to ensure the drawer is rendered before animating
			requestAnimationFrame(() => {
				Animated.parallel([
					Animated.timing(slideAnim, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(backdropOpacity, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
				]).start();
			});
		} else {
			// Animate out
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible]);

	const screenHeight = Dimensions.get('window').height;
	const drawerHeight = screenHeight * 0.7; // 70% height for more space
	const translateY = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerHeight, 0], // Slide from bottom (off screen) to visible
	});

	const handleStartDateChange = (event, selectedDate) => {
		if (Platform.OS === 'android') {
			setShowStartPicker(false);
			if (event.type === 'set' && selectedDate) {
				setStartDate(selectedDate);
			}
		} else {
			// iOS - always update the date as user scrolls
			if (selectedDate) {
				setStartDate(selectedDate);
			}
		}
	};

	const handleEndDateChange = (event, selectedDate) => {
		if (Platform.OS === 'android') {
			setShowEndPicker(false);
			if (event.type === 'set' && selectedDate) {
				setEndDate(selectedDate);
			}
		} else {
			// iOS - always update the date as user scrolls
			if (selectedDate) {
				setEndDate(selectedDate);
			}
		}
	};

	const handleStartDatePress = () => {
		// Close end picker if open
		if (showEndPicker) {
			setShowEndPicker(false);
		}
		setShowStartPicker(true);
	};

	const handleEndDatePress = () => {
		// Close start picker if open
		if (showStartPicker) {
			setShowStartPicker(false);
		}
		setShowEndPicker(true);
	};

	const handleStartDateConfirm = () => {
		setShowStartPicker(false);
	};

	const handleEndDateConfirm = () => {
		setShowEndPicker(false);
	};

	const handleConfirm = () => {
		// Validate dates
		if (!startDate || !endDate) {
			Alert.alert('Error', 'Please select both start and end dates');
			return;
		}

		// Validate start date <= end date
		if (startDate > endDate) {
			Alert.alert('Error', 'Start date must be before or equal to end date');
			return;
		}

		const data = {
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
		};

		if (reason.trim()) {
			data.reason = reason.trim();
		}

		onConfirm(data);
		handleClose();
	};

	const handleClose = () => {
		setStartDate(null);
		setEndDate(null);
		setReason('');
		setShowStartPicker(false);
		setShowEndPicker(false);
		onRequestClose();
	};

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="none"
			onRequestClose={handleClose}>
			<Pressable
				style={styles.modalContainer}
				onPress={handleClose}>
				<Animated.View
					style={[
						styles.backdrop,
						{
							opacity: backdropOpacity,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.drawer,
						{
							height: drawerHeight,
							backgroundColor: colors.cardBackground,
							transform: [{ translateY }],
						},
					]}
					onStartShouldSetResponder={() => true}>
					{/* Header */}
					<View
						style={[
							styles.header,
							{
								backgroundColor: primaryColor,
								borderBottomColor: lightenColor(primaryColor),
							},
						]}>
						<Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
							Block Unavailable Dates
						</Text>
						<TouchableOpacity
							onPress={handleClose}
							style={styles.closeButton}>
							<Icon name="close" size={24} color="#FFFFFF" />
						</TouchableOpacity>
					</View>

					{/* Content */}
					<ScrollView
						style={styles.content}
						contentContainerStyle={styles.contentContainer}
						showsVerticalScrollIndicator={false}>
						{/* Date Selection - Side by Side */}
						<View style={styles.inputSection}>
							<Text style={[styles.label, { color: colors.text }]}>
								Date Range
							</Text>
							<View style={styles.dateRow}>
								{/* Start Date */}
								<TouchableOpacity
									style={[
										styles.dateInput,
										{
											backgroundColor:
												colorMode === 'dark'
													? 'rgba(255, 255, 255, 0.1)'
													: 'rgba(255, 255, 255, 0.9)',
											borderColor: lightenColor(primaryColor),
										},
									]}
									onPress={handleStartDatePress}
									disabled={showEndPicker}>
									<Icon
										name="calendar"
										size={20}
										color={primaryColor}
										style={styles.inputIcon}
									/>
									<Text
										style={[
											styles.dateText,
											{
												color: startDate
													? colors.text
													: colors.textSecondary,
											},
										]}>
										{startDate ? formatDate(startDate) : 'Start Date'}
									</Text>
								</TouchableOpacity>

								{/* End Date */}
								<TouchableOpacity
									style={[
										styles.dateInput,
										{
											backgroundColor:
												colorMode === 'dark'
													? 'rgba(255, 255, 255, 0.1)'
													: 'rgba(255, 255, 255, 0.9)',
											borderColor: lightenColor(primaryColor),
										},
									]}
									onPress={handleEndDatePress}
									disabled={showStartPicker}>
									<Icon
										name="calendar"
										size={20}
										color={primaryColor}
										style={styles.inputIcon}
									/>
									<Text
										style={[
											styles.dateText,
											{
												color: endDate
													? colors.text
													: colors.textSecondary,
											},
										]}>
										{endDate ? formatDate(endDate) : 'End Date'}
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Reason */}
						<View style={styles.inputSection}>
							<Text style={[styles.label, { color: colors.text }]}>
								Reason (optional)
							</Text>
							<TextInput
								style={[
									styles.textArea,
									{
										backgroundColor:
											colorMode === 'dark'
												? 'rgba(255, 255, 255, 0.1)'
												: 'rgba(255, 255, 255, 0.9)',
										color: colors.text,
										borderColor: lightenColor(primaryColor),
									},
								]}
								placeholder="Reason for unavailability..."
								placeholderTextColor={colors.textSecondary}
								value={reason}
								onChangeText={setReason}
								multiline
								numberOfLines={4}
								textAlignVertical="top"
							/>
						</View>
					</ScrollView>

					{/* Footer Buttons */}
					<View
						style={[
							styles.footer,
							{
								borderTopColor: colors.border,
								backgroundColor: colors.cardBackground,
							},
						]}>
						<Button
							text="Cancel"
							onPress={handleClose}
							type="secondary"
							secondaryColor={colors.textSecondary}
							style={styles.footerButton}
						/>
						<Button
							text="Block Dates"
							onPress={handleConfirm}
							type="primary"
							primaryColor={primaryColor}
							style={styles.footerButton}
						/>
					</View>
				</Animated.View>
			</Pressable>

			{/* Date Pickers */}
			{Platform.OS === 'ios' && showStartPicker && (
				<Modal
					visible={showStartPicker}
					transparent={true}
					animationType="slide"
					onRequestClose={handleStartDateConfirm}>
					<View style={styles.datePickerModal}>
						<View style={[styles.datePickerContainer, { backgroundColor: colors.cardBackground }]}>
							<View style={styles.datePickerHeader}>
								<TouchableOpacity onPress={handleStartDateConfirm}>
									<Text style={[styles.datePickerButton, { color: primaryColor }]}>Done</Text>
								</TouchableOpacity>
							</View>
							<DateTimePicker
								value={startDate || new Date()}
								mode="date"
								display="spinner"
								onChange={handleStartDateChange}
								minimumDate={new Date()}
								style={styles.datePicker}
							/>
						</View>
					</View>
				</Modal>
			)}
			{Platform.OS === 'android' && showStartPicker && (
				<DateTimePicker
					value={startDate || new Date()}
					mode="date"
					display="default"
					onChange={handleStartDateChange}
					minimumDate={new Date()}
				/>
			)}
			{Platform.OS === 'ios' && showEndPicker && (
				<Modal
					visible={showEndPicker}
					transparent={true}
					animationType="slide"
					onRequestClose={handleEndDateConfirm}>
					<View style={styles.datePickerModal}>
						<View style={[styles.datePickerContainer, { backgroundColor: colors.cardBackground }]}>
							<View style={styles.datePickerHeader}>
								<TouchableOpacity onPress={handleEndDateConfirm}>
									<Text style={[styles.datePickerButton, { color: primaryColor }]}>Done</Text>
								</TouchableOpacity>
							</View>
							<DateTimePicker
								value={endDate || startDate || new Date()}
								mode="date"
								display="spinner"
								onChange={handleEndDateChange}
								minimumDate={startDate || new Date()}
								style={styles.datePicker}
							/>
						</View>
					</View>
				</Modal>
			)}
			{Platform.OS === 'android' && showEndPicker && (
				<DateTimePicker
					value={endDate || startDate || new Date()}
					mode="date"
					display="default"
					onChange={handleEndDateChange}
					minimumDate={startDate || new Date()}
				/>
			)}
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	drawer: {
		width: '100%',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	headerTitle: {
		...typography.h3,
		fontSize: 20,
		fontWeight: '600',
		flex: 1,
	},
	closeButton: {
		padding: 4,
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		padding: 20,
	},
	inputSection: {
		marginBottom: 20,
	},
	label: {
		...typography.body,
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	hint: {
		...typography.bodySmall,
		fontSize: 12,
		marginTop: 4,
		fontStyle: 'italic',
	},
	dateRow: {
		flexDirection: 'row',
		gap: 12,
	},
	dateInput: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		minHeight: 50,
	},
	inputIcon: {
		marginRight: 12,
	},
	dateText: {
		flex: 1,
		fontSize: 14,
		...typography.body,
	},
	textArea: {
		borderWidth: 1,
		borderRadius: 10,
		padding: 12,
		minHeight: 100,
		fontSize: 14,
		...typography.body,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		gap: 12,
	},
	footerButton: {
		flex: 1,
	},
	datePickerModal: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	datePickerContainer: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 20,
	},
	datePickerHeader: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	datePickerButton: {
		fontSize: 16,
		fontWeight: '600',
		...typography.body,
	},
	datePicker: {
		width: '100%',
		height: 200,
	},
});

export default BlockDatesDrawer;
