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
import StatusBadge from '../../../shared/components/StatusBadge';
import { typography } from '../../../shared/styles/typography';
import { formatScheduleDate, normalizeDateString } from '../../../shared/helper/normalizers';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SwapRequestsScreen = ({ route }) => {
	const { organization, teams, user } = useData();
	if (!user || !organization) {
        return null; 
    }
	const navigation = useNavigation();
	const { colors, colorMode } = useTheme();
	const [swapRequests, setSwapRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState(null);
	const [selectedDate, setSelectedDate] = useState(route.params?.selectedDate || null);

	useEffect(() => {
		if (route.params?.selectedDate) {
			setSelectedDate(route.params.selectedDate);
		}
	}, [route.params?.selectedDate]);

	useEffect(() => {
		if (teams && teams.length > 0 && !selectedTeam) {
			// Default to "All Teams" to show all swap requests
			setSelectedTeam('all');
		}
	}, [teams]);

	useEffect(() => {
		loadSwapRequests();
	}, [selectedTeam, selectedDate, organization?.id]);

	const loadSwapRequests = async () => {
		try {
			setLoading(true);
			const allSwapRequests = [];
			
			// If a specific team is selected, fetch for that team
			if (selectedTeam && selectedTeam !== 'all') {
				const response = await schedulesApi.getTeamSwapRequests(
					parseInt(selectedTeam),
					'pending'
				);
				if (response.swapRequests) {
					allSwapRequests.push(...response.swapRequests);
				}
			} else {
				// Fetch swap requests for all teams
				if (teams && teams.length > 0) {
					for (const team of teams) {
						try {
							const response = await schedulesApi.getTeamSwapRequests(team.id, 'pending');
							if (response.swapRequests) {
								allSwapRequests.push(...response.swapRequests);
							}
						} catch (error) {
							console.error(`Error fetching swap requests for team ${team.id}:`, error);
						}
					}
				}
			}
			
			// Filter by organization
			let filtered = allSwapRequests.filter((swapRequest) => {
				if (swapRequest.organizationId) {
					return swapRequest.organizationId === organization?.id;
				}
				// If no organizationId, check if it belongs to a team in current organization
				if (swapRequest.scheduleRequest?.teamId && teams) {
					const team = teams.find((t) => t.id === swapRequest.scheduleRequest.teamId);
					return team && team.organizationId === organization?.id;
				}
				return true;
			});
			
			// Filter by date if selectedDate is provided
			if (selectedDate) {
				filtered = filtered.filter((swapRequest) => {
					if (!swapRequest.scheduleRequest?.scheduledDate) return false;
					// Use normalizeDateString to avoid timezone issues
					const swapDateString = normalizeDateString(swapRequest.scheduleRequest.scheduledDate);
					const selectedDateString = normalizeDateString(selectedDate);
					return swapDateString === selectedDateString;
				});
			}
			
			// Only show swap requests from other users (not the current user's own requests)
			filtered = filtered.filter((swapRequest) => {
				return swapRequest.requesterId !== user?.id;
			});
			
			setSwapRequests(filtered);
		} catch (error) {
			console.error('Error loading swap requests:', error);
			Alert.alert('Error', 'Failed to load swap requests. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadSwapRequests();
	}, [selectedTeam, selectedDate, organization?.id, teams, user?.id]);

	const handleAcceptSwap = async (swapId) => {
		Alert.alert(
			'Take Shift',
			'Are you sure you want to take this shift?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Take Shift',
					onPress: async () => {
						try {
							await schedulesApi.acceptSwap(swapId);
							Alert.alert('Success', 'Shift accepted successfully');
							loadSwapRequests();
						} catch (error) {
							console.error('Error accepting swap:', error);
							Alert.alert('Error', 'Failed to accept swap. Please try again.');
						}
					},
				},
			]
		);
	};

	if (!teams || teams.length === 0) {
		return (
			<Background>
				<View style={styles.container}>
					<View style={styles.header}>
						<Text style={[styles.title, { color: colors.text }]}>
							Swap Requests
						</Text>
					</View>
					<View style={styles.emptyState}>
						<Icon
							name="account-group"
							size={64}
							color={colors.textSecondary}
							style={styles.emptyIcon}
						/>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No Teams Available
						</Text>
						<Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
							You need to be part of a team to view swap requests
						</Text>
					</View>
				</View>
			</Background>
		);
	}

	return (
		<Background>
			<ScrollView
				style={styles.container}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: colors.text }]}>
							Swap Requests
						</Text>
						{selectedDate && (
							<TouchableOpacity
								onPress={() => {
									setSelectedDate(null);
									navigation.setParams({ selectedDate: null });
								}}
								style={[styles.dateFilterBadge, { backgroundColor: colors.cardBackground }]}>
								<Text style={[styles.dateFilterText, { color: colors.text }]}>
									{new Date(selectedDate).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
									})}
								</Text>
								<Icon name="close-circle" size={16} color={colors.textSecondary} />
							</TouchableOpacity>
						)}
					</View>
				</View>

				{/* Team Filter */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.teamFilter}>
					<TouchableOpacity
						style={[
							styles.filterChip,
							selectedTeam === 'all' && styles.filterChipActive,
							selectedTeam === 'all' && {
								backgroundColor: colors.primary,
							},
						]}
						onPress={() => setSelectedTeam('all')}>
						<Text
							style={[
								styles.filterChipText,
								{ color: colors.text },
								selectedTeam === 'all' && {
									color: '#FFFFFF',
								},
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

				{/* Swap Requests List */}
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={colors.primary} />
					</View>
				) : swapRequests.length > 0 ? (
					<View style={styles.swapRequestsList}>
						{swapRequests.map((swapRequest) => (
							<View
								key={swapRequest.id}
								style={[
									styles.swapCard,
									{
										backgroundColor: colorMode === 'dark' 
											? 'rgba(255, 255, 255, 0.1)' 
											: 'rgba(255, 255, 255, 0.9)',
									},
								]}>
								<View style={styles.swapCardContent}>
									<View style={styles.swapHeader}>
										<Text style={[styles.date, { color: colors.text }]}>
											{swapRequest.scheduleRequest?.scheduledDate
												? formatScheduleDate(swapRequest.scheduleRequest.scheduledDate)
												: 'Date TBD'}
										</Text>
										<StatusBadge status={swapRequest.status} />
									</View>

									{swapRequest.scheduleRequest?.plan && (
										<Text
											style={[styles.planTitle, { color: colors.text }]}
											numberOfLines={1}>
											{swapRequest.scheduleRequest.plan.mainTitle}
										</Text>
									)}

									{swapRequest.scheduleRequest?.team && (
										<Text
											style={[styles.teamName, { color: colors.textSecondary }]}
											numberOfLines={1}>
											{swapRequest.scheduleRequest.team.name}
										</Text>
									)}

									{swapRequest.requester && (
										<Text
											style={[styles.requester, { color: colors.textSecondary }]}
											numberOfLines={1}>
											Requested by: {swapRequest.requester.firstName}{' '}
											{swapRequest.requester.lastName}
										</Text>
									)}

									{swapRequest.reason && (
										<Text
											style={[styles.reason, { color: colors.textSecondary }]}
											numberOfLines={2}>
											{swapRequest.reason}
										</Text>
									)}

									{swapRequest.status === 'pending' && (
										<TouchableOpacity
											style={[styles.takeShiftButton, { backgroundColor: '#52c41a' }]}
											onPress={() => handleAcceptSwap(swapRequest.id)}>
											<Text style={styles.takeShiftButtonText}>Take Shift</Text>
										</TouchableOpacity>
									)}
								</View>
							</View>
						))}
					</View>
				) : (
					<View style={styles.emptyState}>
						<Icon
							name="swap-horizontal"
							size={64}
							color={colors.textSecondary}
							style={styles.emptyIcon}
						/>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No Swap Requests
						</Text>
						<Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
							There are no pending swap requests for this team
						</Text>
					</View>
				)}
			</ScrollView>
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
	},
	titleContainer: {
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
	teamFilter: {
		paddingHorizontal: 20,
		marginBottom: 16,
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
	swapRequestsList: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	swapCard: {
		borderRadius: 12,
		marginBottom: 12,
		padding: 16,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
	},
	swapCardContent: {
		flex: 1,
	},
	swapHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	date: {
		...typography.h3,
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	planTitle: {
		...typography.body,
		fontSize: 15,
		fontWeight: '500',
		marginBottom: 4,
	},
	teamName: {
		...typography.body,
		fontSize: 14,
		opacity: 0.8,
		marginBottom: 4,
	},
	requester: {
		...typography.body,
		fontSize: 12,
		opacity: 0.7,
		marginBottom: 4,
	},
	reason: {
		...typography.body,
		fontSize: 13,
		opacity: 0.8,
		marginBottom: 12,
		fontStyle: 'italic',
	},
	takeShiftButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 8,
	},
	takeShiftButtonText: {
		...typography.body,
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
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

export default SwapRequestsScreen;
