import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	RefreshControl,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { schedulesApi } from '../../../api/schedulesRoutes';
import BlockDatesDrawer from '../../../shared/components/BlockDatesDrawer';
import { typography } from '../../../shared/styles/typography';
import { formatScheduleDate } from '../../../shared/helper/normalizers';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const UnavailableDatesScreen = () => {
	const { organization } = useData();
	if (!organization) {
		return null;
	}
	const { colors, colorMode } = useTheme();
	const [unavailableDates, setUnavailableDates] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [blockModalVisible, setBlockModalVisible] = useState(false);

	useEffect(() => {
		loadUnavailableDates();
	}, [organization?.id]);

	const loadUnavailableDates = async () => {
		try {
			setLoading(true);
			const filters = {};
			// Add organization filter to ensure we only get unavailable dates for current organization
			if (organization?.id) {
				filters.organizationId = organization.id;
			}

			const response = await schedulesApi.getMyUnavailableDates(filters);
			setUnavailableDates(response.unavailableDates || []);
		} catch (error) {
			console.error('Error loading unavailable dates:', error);
			Alert.alert(
				'Error',
				'Failed to load unavailable dates. Please try again.',
			);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadUnavailableDates();
	}, []);

	const handleBlockDates = () => {
		setBlockModalVisible(true);
	};

	const handleBlockConfirm = async (data) => {
		data.endDate = new Date(data.endDate).toISOString();
		data.startDate = new Date(data.startDate).toISOString();
		console.log('Blocking dates from UnavailableDatesScreen:', data);
		try {
			await schedulesApi.blockDates(data);
			Alert.alert('Success', 'Dates blocked successfully');
			setBlockModalVisible(false);
			loadUnavailableDates();
		} catch (error) {
			// This will reveal the validation messages from express-validator
			console.error('Validation Error Details:', error.response?.data);
			Alert.alert(
				'Error',
				error.response?.data?.message || 'Failed to block dates',
			);
		}
	};

	const handleRemove = async (id) => {
		Alert.alert(
			'Remove Unavailable Dates',
			'Are you sure you want to remove these blocked dates?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						try {
							await schedulesApi.removeUnavailableDate(id);
							Alert.alert('Success', 'Unavailable dates removed');
							loadUnavailableDates();
						} catch (error) {
							console.error(
								'Error removing unavailable dates:',
								error,
							);
							Alert.alert(
								'Error',
								'Failed to remove unavailable dates. Please try again.',
							);
						}
					},
				},
			],
		);
	};

	const formatDateRange = (startDate, endDate) => {
		const start = formatScheduleDate(startDate);
		const end = formatScheduleDate(endDate);
		if (start === end) {
			return start;
		}
		return `${start} - ${end}`;
	};

	return (
		<Background>
			<ScrollView
				style={styles.container}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>
						My Unavailable Dates
					</Text>
					<TouchableOpacity
						style={[
							styles.addButton,
							{ backgroundColor: colors.primary },
						]}
						onPress={handleBlockDates}>
						<Icon
							name='plus'
							size={20}
							color='#FFFFFF'
						/>
						<Text style={styles.addButtonText}>Block Dates</Text>
					</TouchableOpacity>
				</View>

				{/* Unavailable Dates List */}
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator
							size='large'
							color={colors.primary}
						/>
					</View>
				) : unavailableDates.length > 0 ? (
					<View style={styles.datesList}>
						{unavailableDates.map((dateRange) => (
							<View
								key={dateRange.id}
								style={[
									styles.dateCard,
									{
										backgroundColor:
											colorMode === 'dark'
												? 'rgba(255, 255, 255, 0.1)'
												: 'rgba(255, 255, 255, 0.9)',
									},
								]}>
								<View style={styles.dateCardContent}>
									<View style={styles.dateInfo}>
										<Text
											style={[
												styles.dateRange,
												{ color: colors.text },
											]}>
											{formatDateRange(
												dateRange.startDate,
												dateRange.endDate,
											)}
										</Text>
										{dateRange.reason && (
											<Text
												style={[
													styles.reason,
													{
														color: colors.textSecondary,
													},
												]}>
												{dateRange.reason}
											</Text>
										)}
									</View>
									<TouchableOpacity
										style={styles.removeButton}
										onPress={() =>
											handleRemove(dateRange.id)
										}>
										<Icon
											name='trash-can-outline'
											size={20}
											color='#ff4d4f'
										/>
									</TouchableOpacity>
								</View>
							</View>
						))}
					</View>
				) : (
					<View style={styles.emptyState}>
						<Icon
							name='calendar-remove'
							size={64}
							color={colors.textSecondary}
							style={styles.emptyIcon}
						/>
						<Text
							style={[
								styles.emptyText,
								{ color: colors.textSecondary },
							]}>
							No unavailable dates
						</Text>
						<Text
							style={[
								styles.emptySubtext,
								{ color: colors.textSecondary },
							]}>
							Block dates when you're unavailable to prevent
							schedule requests
						</Text>
						<TouchableOpacity
							style={[
								styles.emptyButton,
								{ backgroundColor: colors.primary },
							]}
							onPress={handleBlockDates}>
							<Text style={styles.emptyButtonText}>
								Block Dates
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</ScrollView>

			{/* Block Dates Drawer */}
			<BlockDatesDrawer
				visible={blockModalVisible}
				onRequestClose={() => setBlockModalVisible(false)}
				onConfirm={handleBlockConfirm}
			/>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		padding: 20,
		paddingBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	title: {
		...typography.h2,
		fontSize: 24,
		fontWeight: '600',
		flex: 1,
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		gap: 8,
	},
	addButtonText: {
		...typography.body,
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	datesList: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	dateCard: {
		borderRadius: 12,
		marginBottom: 12,
		padding: 16,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
	},
	dateCardContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	dateInfo: {
		flex: 1,
	},
	dateRange: {
		...typography.h3,
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	reason: {
		...typography.body,
		fontSize: 14,
		marginBottom: 4,
	},
	removeButton: {
		padding: 8,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
		paddingHorizontal: 40,
	},
	emptyIcon: {
		opacity: 0.5,
		marginBottom: 16,
	},
	emptyText: {
		...typography.h3,
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySubtext: {
		...typography.body,
		fontSize: 14,
		textAlign: 'center',
		opacity: 0.7,
		marginBottom: 24,
	},
	emptyButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	emptyButtonText: {
		...typography.body,
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
	},
});

export default UnavailableDatesScreen;
