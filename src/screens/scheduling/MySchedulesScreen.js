import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { schedulesApi } from '../../../api/schedulesRoutes';
import ScheduleCard from '../../../shared/components/ScheduleCard';
import DeclineScheduleModal from '../../../shared/components/DeclineScheduleModal';
import RequestSwapModal from '../../../shared/components/RequestSwapModal';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { formatScheduleDate, normalizeDateString } from '../../../shared/helper/normalizers';

const MySchedulesScreen = ({ route }) => {
	const navigation = useNavigation();
	const { organization, teams } = useData();
	if (!organization) {
        return null; 
    }
	const { colors, organization: orgData } = useTheme();
	const [schedules, setSchedules] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState(null);
	const [selectedTeam, setSelectedTeam] = useState(null);
	const [selectedDate, setSelectedDate] = useState(route.params?.selectedDate || null);
	const [declineModalVisible, setDeclineModalVisible] = useState(false);
	const [swapModalVisible, setSwapModalVisible] = useState(false);
	const [selectedSchedule, setSelectedSchedule] = useState(null);
	const [highlightedScheduleId, setHighlightedScheduleId] = useState(null);
	const scrollViewRef = useRef(null);

	useEffect(() => {
		if (route.params?.selectedDate) {
			setSelectedDate(route.params.selectedDate);
		}
		
		// Handle schedule highlighting from notification
		if (route.params?.highlightScheduleId) {
			const scheduleId = route.params.highlightScheduleId;
			setHighlightedScheduleId(scheduleId);
			
			// Scroll to highlighted schedule after data loads
			if (filteredSchedules.length > 0 && scrollViewRef.current) {
				const scheduleIndex = filteredSchedules.findIndex(s => s.id === scheduleId);
				if (scheduleIndex !== -1) {
					// Scroll to the schedule after a short delay to ensure it's rendered
					setTimeout(() => {
						scrollViewRef.current?.scrollTo({
							y: scheduleIndex * 200, // Approximate height per card
							animated: true,
						});
					}, 300);
				}
			}
			
			// Clear highlight after 5 seconds
			setTimeout(() => {
				setHighlightedScheduleId(null);
			}, 5000);
		}
	}, [route.params, filteredSchedules]);

	useEffect(() => {
		loadSchedules();
	}, [selectedStatus, selectedTeam, selectedDate, organization?.id]);

	const loadSchedules = async () => {
		try {
			setLoading(true);
			const filters = {};
			if (selectedStatus) filters.status = selectedStatus;
			if (selectedTeam) filters.teamId = selectedTeam;
			if (selectedDate) {
				filters.startDate = selectedDate;
				filters.endDate = selectedDate;
			}
			// Add organization filter to ensure we only get schedules for current organization
			if (organization?.id) {
				filters.organizationId = organization.id;
			}
			
			const response = await schedulesApi.getMySchedules(filters);
			setSchedules(response.scheduleRequests || []);
		} catch (error) {
			console.error('Error loading schedules:', error);
			Alert.alert('Error', 'Failed to load schedules. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadSchedules();
	}, [selectedStatus, selectedTeam, selectedDate, organization?.id]);

	const handleAccept = async (schedule) => {
		try {
			await schedulesApi.accept(schedule.id);
			Alert.alert('Success', 'Schedule request accepted');
			loadSchedules();
		} catch (error) {
			console.error('Error accepting schedule:', error);
			Alert.alert('Error', 'Failed to accept schedule. Please try again.');
		}
	};

	const handleDecline = (schedule) => {
		setSelectedSchedule(schedule);
		setDeclineModalVisible(true);
	};

	const handleDeclineConfirm = async (declineReason) => {
		try {
			await schedulesApi.decline(selectedSchedule.id, declineReason);
			Alert.alert('Success', 'Schedule request declined');
			setDeclineModalVisible(false);
			setSelectedSchedule(null);
			loadSchedules();
		} catch (error) {
			console.error('Error declining schedule:', error);
			Alert.alert('Error', 'Failed to decline schedule. Please try again.');
		}
	};

	const handleRequestSwap = (schedule) => {
		setSelectedSchedule(schedule);
		setSwapModalVisible(true);
	};

	const handleSwapConfirm = async (reason) => {
		try {
			await schedulesApi.requestSwap(selectedSchedule.id, reason);
			Alert.alert('Success', 'Swap requested successfully');
			setSwapModalVisible(false);
			setSelectedSchedule(null);
			loadSchedules();
		} catch (error) {
			console.error('Error requesting swap:', error);
			Alert.alert('Error', 'Failed to request swap. Please try again.');
		}
	};

	const handleSchedulePress = (schedule) => {
		if (schedule.planId) {
			navigation.navigate('PlanView', { planId: schedule.planId });
		}
	};

	const statusOptions = [
		{ label: 'All', value: null },
		{ label: 'Pending', value: 'pending' },
		{ label: 'Approved', value: 'approved' },
		{ label: 'Declined', value: 'declined' },
		{ label: 'Swap Requested', value: 'swap_requested' },
	];

	const filteredSchedules = schedules.filter((schedule) => {
		if (selectedStatus && schedule.status !== selectedStatus) return false;
		if (selectedTeam && schedule.teamId !== parseInt(selectedTeam)) return false;
		// If a date is selected, filter by that date (normalize both dates for comparison)
		if (selectedDate) {
			const scheduleDateNormalized = normalizeDateString(schedule.scheduledDate);
			const selectedDateNormalized = normalizeDateString(selectedDate);
			if (scheduleDateNormalized !== selectedDateNormalized) return false;
		}
		return true;
	});

	const clearDateFilter = () => {
		setSelectedDate(null);
		navigation.setParams({ selectedDate: null });
	};

	return (
		<Background>
			<ScrollView
				ref={scrollViewRef}
				style={styles.container}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: colors.text }]}>
							My Schedules
						</Text>
						{selectedDate && (
							<TouchableOpacity
								style={styles.dateFilterBadge}
								onPress={clearDateFilter}>
								<Text style={styles.dateFilterText}>
									{new Date(selectedDate).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									})}
								</Text>
								<Icon name="close" size={14} color={colors.text} />
							</TouchableOpacity>
						)}
					</View>
					<TouchableOpacity
						style={[styles.headerButton, { backgroundColor: colors.primary }]}
						onPress={() => navigation.navigate('UnavailableDates')}>
						<Icon name="calendar-remove" size={18} color="#FFFFFF" />
						<Text style={styles.headerButtonText}>Unavailable</Text>
					</TouchableOpacity>
				</View>

				{/* Filters */}
				<View style={styles.filtersContainer}>
					{/* Status Filter */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.statusFilter}>
						{statusOptions.map((option) => (
							<TouchableOpacity
								key={option.value}
								style={[
									styles.filterChip,
									selectedStatus === option.value && styles.filterChipActive,
									selectedStatus === option.value && {
										backgroundColor: colors.primary,
									},
								]}
								onPress={() => setSelectedStatus(option.value)}>
								<Text
									style={[
										styles.filterChipText,
										{ color: colors.text },
										selectedStatus === option.value && {
											color: '#FFFFFF',
										},
									]}>
									{option.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* Team Filter */}
					{teams && teams.length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.teamFilter}>
							<TouchableOpacity
								style={[
									styles.filterChip,
									!selectedTeam && styles.filterChipActive,
									!selectedTeam && {
										backgroundColor: colors.primary,
									},
								]}
								onPress={() => setSelectedTeam(null)}>
								<Text
									style={[
										styles.filterChipText,
										{ color: colors.text },
										!selectedTeam && { color: '#FFFFFF' },
									]}>
									All Teams
								</Text>
							</TouchableOpacity>
							{teams.map((team) => (
								<TouchableOpacity
									key={team.id}
									style={[
										styles.filterChip,
										selectedTeam === team.id.toString() && styles.filterChipActive,
										selectedTeam === team.id.toString() && {
											backgroundColor: colors.primary,
										},
									]}
									onPress={() => setSelectedTeam(team.id.toString())}>
									<Text
										style={[
											styles.filterChipText,
											{ color: colors.text },
											selectedTeam === team.id.toString() && {
												color: '#FFFFFF',
											},
										]}>
										{team.name}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}
				</View>

				{/* Schedules List */}
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={colors.primary} />
					</View>
				) : filteredSchedules.length > 0 ? (
					<View style={styles.schedulesList}>
						{filteredSchedules.map((schedule, index) => (
							<View
								key={schedule.id}
								style={[
									highlightedScheduleId === schedule.id && styles.highlightedSchedule,
								]}>
								<ScheduleCard
									schedule={schedule}
									onPress={() => handleSchedulePress(schedule)}
									onAccept={() => handleAccept(schedule)}
									onDecline={() => handleDecline(schedule)}
									onRequestSwap={() => handleRequestSwap(schedule)}
								/>
							</View>
						))}
					</View>
				) : (
					<View style={styles.emptyState}>
						<Icon
							name="calendar-blank"
							size={64}
							color={colors.textSecondary}
							style={styles.emptyIcon}
						/>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No schedules found
						</Text>
						<Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
							{selectedStatus || selectedTeam
								? 'Try adjusting your filters'
								: 'You don\'t have any schedule requests yet'}
						</Text>
					</View>
				)}
			</ScrollView>

			{/* Modals */}
			<DeclineScheduleModal
				visible={declineModalVisible}
				onClose={() => {
					setDeclineModalVisible(false);
					setSelectedSchedule(null);
				}}
				onConfirm={handleDeclineConfirm}
				schedule={selectedSchedule}
			/>

			<RequestSwapModal
				visible={swapModalVisible}
				onClose={() => {
					setSwapModalVisible(false);
					setSelectedSchedule(null);
				}}
				onConfirm={handleSwapConfirm}
				schedule={selectedSchedule}
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
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	title: {
		...typography.h2,
		fontSize: 24,
		fontWeight: '600',
	},
	dateFilterBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		gap: 6,
	},
	dateFilterText: {
		...typography.body,
		fontSize: 12,
		fontWeight: '500',
	},
	headerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		gap: 6,
	},
	headerButtonText: {
		...typography.body,
		fontSize: 12,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	filtersContainer: {
		paddingHorizontal: 20,
		paddingBottom: 16,
	},
	statusFilter: {
		marginBottom: 12,
	},
	teamFilter: {
		marginBottom: 8,
	},
	filterChip: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	filterChipActive: {
		// backgroundColor will be set dynamically
	},
	filterChipText: {
		...typography.body,
		fontSize: 14,
		fontWeight: '500',
	},
	schedulesList: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	highlightedSchedule: {
		borderWidth: 3,
		borderColor: '#4CAF50',
		borderRadius: 12,
		marginBottom: 12,
		padding: 4,
		backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
	},
});

export default MySchedulesScreen;
