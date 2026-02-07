import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Image,
	Modal,
	Linking,
	Platform,
	ScrollView,
	Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ministryApi } from '../../../api/ministryRoutes';
import { teamsApi } from '../../../api/teamRoutes';
import { schedulesApi } from '../../../api/schedulesRoutes';
import { checkInsApi } from '../../../api/checkInRoutes';
import {
	useNavigation,
	useRoute,
	useIsFocused,
} from '@react-navigation/native';
import { normalizeDateString } from '../../../shared/helper/normalizers';
import Button from '../../../shared/buttons/Button';
import CheckInQRScanner from '../../../shared/components/CheckInQRScanner';

const TeamsScreen = () => {
	const { teams, user, organization } = useData();
	if (!user || !organization) {
		return null;
	}
	const { colors, colorMode } = useTheme();
	const [expandedTeams, setExpandedTeams] = useState({});
	const [checkIns, setCheckIns] = useState({});
	const [loading, setLoading] = useState({});
	const [selectedUser, setSelectedUser] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [teamPlans, setTeamPlans] = useState({});
	const [schedules, setSchedules] = useState([]);
	const [unavailableDates, setUnavailableDates] = useState([]);
	const [swapRequests, setSwapRequests] = useState([]);
	const [markedDates, setMarkedDates] = useState({});
	const [isLoadingScheduling, setIsLoadingScheduling] = useState(false);
	const [ministryDetails, setMinistryDetails] = useState({});
	const [scannerVisible, setScannerVisible] = useState(false);
	const [scannerMinistryId, setScannerMinistryId] = useState(null);
	const [verifyLoading, setVerifyLoading] = useState(false);
	const navigation = useNavigation();
	const route = useRoute();

	const handleOpenScanCheckout = (ministryId) => {
		setScannerMinistryId(ministryId);
		setScannerVisible(true);
	};

	const handleScanCheckoutResult = async (
		checkoutToken,
		ministryIdOverride = null,
	) => {
		setScannerVisible(false);
		const ministryId = ministryIdOverride ?? scannerMinistryId;
		setScannerMinistryId(null);
		if (!ministryId || !checkoutToken) return;
		setVerifyLoading(true);
		try {
			const result = await checkInsApi.verifyCheckoutQr(
				ministryId,
				checkoutToken,
			);
			const attendee = result?.checkIn?.attendee;
			const name = attendee
				? `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() ||
					'Attendee'
				: 'Attendee';
			Alert.alert(
				'Checkout successful',
				`${name} checked out successfully.`,
			);
			const response = await ministryApi.getCheckIns(ministryId);
			setCheckIns((prev) => ({
				...prev,
				[ministryId]: response.checkins || [],
			}));
		} catch (err) {
			const msg =
				err.userMessage ||
				err.response?.data?.message ||
				'Invalid or expired checkout code. Please show the QR code from the check-in confirmation.';
			Alert.alert('Checkout failed', msg);
		} finally {
			setVerifyLoading(false);
		}
	};

	// Deep link: app opened from scanning pickup QR (assemblie://checkout?ministryId=&token=)
	useEffect(() => {
		const verify = route.params?.verifyCheckout;
		if (!verify?.ministryId || !verify?.token) return;
		navigation.setParams({ verifyCheckout: undefined });
		handleScanCheckoutResult(verify.token, verify.ministryId);
	}, [route.params?.verifyCheckout]);

	const toggleTeam = async (teamId) => {
		// Find the team to get its ministryId
		const team = teams.find((t) => t.id === teamId);
		if (!team) {
			console.error('Team not found:', teamId);
			return;
		}

		// Get ministryId from the first ministry in the Ministries array
		const ministryId = team.Ministries?.[0]?.id;

		if (!ministryId) {
			console.error('No ministryId found for team:', team);
			return;
		}

		// If we're expanding and don't have check-ins data yet, fetch it
		if (!expandedTeams[teamId] && !checkIns[ministryId]) {
			setLoading((prev) => ({ ...prev, [teamId]: true }));
			try {
				const response = await ministryApi.getCheckIns(ministryId);
				setCheckIns((prev) => ({
					...prev,
					[ministryId]: response.checkins,
				}));
			} catch (error) {
				console.error('Failed to fetch check-ins:', error);
			} finally {
				setLoading((prev) => ({ ...prev, [teamId]: false }));
			}
		}

		// Fetch ministry detail for QR checkout (requireQrCheckout) when expanding
		if (!expandedTeams[teamId] && !ministryDetails[ministryId]) {
			try {
				const detail = await ministryApi.getMinistry(ministryId);
				setMinistryDetails((prev) => ({
					...prev,
					[ministryId]: detail || {},
				}));
			} catch (error) {
				console.error('Failed to fetch ministry detail:', error);
			}
		}

		// If we're expanding and don't have plans data yet, fetch it
		if (!expandedTeams[teamId] && !teamPlans[teamId]) {
			setLoading((prev) => ({ ...prev, [teamId]: true }));
			try {
				const data = await teamsApi.getTeamPlans(teamId, 'published');
				setTeamPlans((prev) => ({
					...prev,
					[teamId]: data.plans || [],
				}));
			} catch (error) {
				console.error('Failed to fetch plans:', error);
			} finally {
				setLoading((prev) => ({ ...prev, [teamId]: false }));
			}
		}

		setExpandedTeams((prev) => ({
			...prev,
			[teamId]: !prev[teamId],
		}));
	};

	// Debug log for teams data (only log when teams change, not on every render)
	useEffect(() => {
		if (teams && teams.length > 0) {
			console.log('Teams loaded:', teams.length, 'teams');
		}
	}, [teams]);

	const loadSchedulingData = useCallback(async () => {
		if (!organization?.id) return;
		setIsLoadingScheduling(true);
		try {
			// Fetch all schedules for current organization
			const schedulesResponse = await schedulesApi.getMySchedules({
				organizationId: organization.id,
			});
			setSchedules(schedulesResponse.scheduleRequests || []);

			// Fetch unavailable dates for current organization
			const unavailableResponse =
				await schedulesApi.getMyUnavailableDates({
					organizationId: organization.id,
				});
			setUnavailableDates(unavailableResponse.unavailableDates || []);

			// Fetch swap requests for all teams
			const allSwapRequests = [];
			if (teams && teams.length > 0) {
				for (const team of teams) {
					try {
						const swapResponse =
							await schedulesApi.getTeamSwapRequests(
								team.id,
								'pending',
							);
						if (swapResponse.swapRequests) {
							allSwapRequests.push(...swapResponse.swapRequests);
						}
					} catch (error) {
						console.error(
							`Error fetching swap requests for team ${team.id}:`,
							error,
						);
					}
				}
			}
			setSwapRequests(allSwapRequests);
		} catch (error) {
			console.error('Error loading scheduling data:', error);
		} finally {
			setIsLoadingScheduling(false);
		}
	}, [teams, organization?.id]);

	// Fetch schedules and unavailable dates for calendar
	useEffect(() => {
		if (
			teams &&
			teams.length > 0 &&
			organization?.id &&
			!isLoadingScheduling
		) {
			loadSchedulingData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teams?.length, organization?.id]); // Trigger when teams count or organization changes

	// Build marked dates for calendar
	useEffect(() => {
		if (!organization?.id) return;

		const dates = {};

		// Process schedules - filter by current organization
		schedules
			.filter((schedule) => {
				// Filter by organization if the schedule has organizationId
				if (schedule.organizationId) {
					return schedule.organizationId === organization.id;
				}
				// If no organizationId on schedule, check if it belongs to a team in current organization
				if (schedule.teamId && teams) {
					const team = teams.find((t) => t.id === schedule.teamId);
					return team && team.organizationId === organization.id;
				}
				// If we can't determine, include it (backend should have filtered)
				return true;
			})
			.forEach((schedule) => {
				// Normalize the date to YYYY-MM-DD format to avoid timezone issues
				const dateString =
					normalizeDateString(schedule.scheduledDate) ||
					schedule.scheduledDate;
				if (!dates[dateString]) {
					dates[dateString] = { dots: [], customStyles: {} };
				}

				// Yellow dot - pending request
				if (schedule.status === 'pending') {
					dates[dateString].dots.push({
						key: `pending-${schedule.id}`,
						color: '#fa8c16', // Yellow
					});
				}
				// Green dot - Accepted request
				else if (schedule.status === 'approved') {
					dates[dateString].dots.push({
						key: `approved-${schedule.id}`,
						color: '#52c41a', // Green
					});
				}
				// Red ! - current user is requesting a swap (use red dot with special marking)
				if (
					schedule.status === 'swap_requested' &&
					schedule.userId === user?.id
				) {
					dates[dateString].dots.push({
						key: `swap-requested-${schedule.id}`,
						color: '#ff4d4f', // Red
						selectedDotColor: '#ff4d4f',
					});
					// Mark this date with a special indicator
					dates[dateString].marked = true;
					dates[dateString].dotColor = '#ff4d4f';
				}
			});

		// Process unavailable dates (blocked out days) - Red X
		unavailableDates.forEach((unavailable) => {
			const start = new Date(unavailable.startDate);
			const end = new Date(unavailable.endDate);
			for (
				let date = new Date(start);
				date <= end;
				date.setDate(date.getDate() + 1)
			) {
				const dateString = date.toISOString().split('T')[0];
				if (!dates[dateString]) {
					dates[dateString] = { dots: [], customStyles: {} };
				}
				// Mark blocked dates with disabled style
				dates[dateString].disabled = true;
				dates[dateString].disableTouchEvent = false;
				dates[dateString].dots.push({
					key: `blocked-${unavailable.id}-${dateString}`,
					color: '#ff4d4f', // Red
					selectedDotColor: '#ff4d4f',
				});
			}
		});

		// Process swap requests from other users - Purple !
		// Filter by current organization
		swapRequests
			.filter((swapRequest) => {
				// Filter by organization if the swap request has organizationId
				if (swapRequest.organizationId) {
					return swapRequest.organizationId === organization.id;
				}
				// If no organizationId, check if it belongs to a team in current organization
				if (swapRequest.scheduleRequest?.teamId && teams) {
					const team = teams.find(
						(t) => t.id === swapRequest.scheduleRequest.teamId,
					);
					return team && team.organizationId === organization.id;
				}
				// If we can't determine, include it (backend should have filtered)
				return true;
			})
			.forEach((swapRequest) => {
				if (
					swapRequest.requesterId !== user?.id &&
					swapRequest.scheduleRequest?.scheduledDate
				) {
					// Normalize the date to YYYY-MM-DD format to avoid timezone issues
					const dateString =
						normalizeDateString(
							swapRequest.scheduleRequest.scheduledDate,
						) || swapRequest.scheduleRequest.scheduledDate;
					if (!dates[dateString]) {
						dates[dateString] = { dots: [], customStyles: {} };
					}
					dates[dateString].dots.push({
						key: `swap-other-${swapRequest.id}`,
						color: '#9c27b0', // Purple
						selectedDotColor: '#9c27b0',
					});
				}
			});

		setMarkedDates(dates);
	}, [
		schedules,
		unavailableDates,
		swapRequests,
		user,
		organization?.id,
		teams,
	]);

	const handleDayPress = useCallback(
		(day) => {
			const dateString = day.dateString;

			// Check if there are swap requests from other users for this day
			const daySwapRequests = swapRequests.filter((swapRequest) => {
				if (swapRequest.requesterId === user?.id) return false; // Skip user's own swap requests
				if (!swapRequest.scheduleRequest?.scheduledDate) return false;

				const swapDateString = normalizeDateString(
					swapRequest.scheduleRequest.scheduledDate,
				);
				return swapDateString === dateString;
			});

			// If there are swap requests for this day, navigate to SwapRequestsScreen
			if (daySwapRequests.length > 0) {
				navigation.navigate('SwapRequests', {
					selectedDate: dateString,
					organizationId: organization?.id,
				});
			} else {
				// Otherwise, navigate to MySchedules with date filter
				navigation.navigate('MySchedules', {
					selectedDate: dateString,
				});
			}
		},
		[navigation, swapRequests, user?.id, organization?.id],
	);

	const handleViewMySchedule = useCallback(() => {
		// Navigate to MySchedules screen without date filter
		// Use the same navigation pattern as PlanView
		navigation.navigate('MySchedules');
	}, [navigation]);

	const formatPhoneNumber = (phoneNumber) => {
		if (!phoneNumber) return '';
		// Remove all non-digit characters
		const cleaned = phoneNumber.replace(/\D/g, '');
		// Check if we have a 10-digit number
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)}) ${cleaned.slice(
				3,
				6,
			)}-${cleaned.slice(6)}`;
		}
		// Return original if not 10 digits
		return phoneNumber;
	};

	// Function to handle phone calls
	const handleCall = (phoneNumber) => {
		const url = `tel:${phoneNumber}`;
		Linking.canOpenURL(url)
			.then((supported) => {
				if (supported) {
					return Linking.openURL(url);
				}
				console.log('Phone calls not supported');
			})
			.catch((err) => console.error('An error occurred', err));
	};

	// Function to handle text messages
	const handleText = (phoneNumber) => {
		const url = Platform.select({
			ios: `sms:${phoneNumber}`,
			android: `sms:${phoneNumber}`,
		});
		Linking.canOpenURL(url)
			.then((supported) => {
				if (supported) {
					return Linking.openURL(url);
				}
				console.log('SMS not supported');
			})
			.catch((err) => console.error('An error occurred', err));
	};

	const ContactModal = () => (
		<Modal
			animationType='slide'
			transparent={true}
			visible={isModalVisible}
			onRequestClose={() => setIsModalVisible(false)}>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.modalContent,
						{ backgroundColor: colors.primary },
					]}>
					<Text
						style={[
							styles.modalTitle,
							{ color: colors.textWhite },
						]}>
						Contact {selectedUser?.name}
					</Text>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[
								styles.modalButton,
								{ backgroundColor: 'rgba(255, 255, 255, 0.1)' },
							]}
							onPress={() => {
								handleCall(selectedUser?.phoneNumber);
								setIsModalVisible(false);
							}}>
							<View style={styles.iconCircle}>
								<Icon
									name='phone'
									size={24}
									color={colors.textWhite}
								/>
							</View>
							<Text
								style={[
									styles.modalButtonText,
									{ color: colors.textWhite },
								]}>
								Call
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.modalButton,
								{ backgroundColor: 'rgba(255, 255, 255, 0.1)' },
							]}
							onPress={() => {
								handleText(selectedUser?.phoneNumber);
								setIsModalVisible(false);
							}}>
							<View style={styles.iconCircle}>
								<Icon
									name='message'
									size={24}
									color={colors.textWhite}
								/>
							</View>
							<Text
								style={[
									styles.modalButtonText,
									{ color: colors.textWhite },
								]}>
								Text
							</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[
							styles.cancelButton,
							{ backgroundColor: colors.error },
						]}
						onPress={() => setIsModalVisible(false)}>
						<Text
							style={[
								styles.modalButtonText,
								{ color: colors.textWhite },
							]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	const renderCheckedInPerson = ({ item }) => {
		// Use the attendee object which contains the person's details
		let name = '';
		let photo = null;
		let phoneNumber = '';

		if (item.User) {
			name = `${item.User.firstName} ${item.User.lastName}`;
			photo = item.User.userPhoto;
			phoneNumber = item.User.phoneNumber;
		} else if (item.FamilyMember) {
			name = `${item.FamilyMember.firstName} ${item.FamilyMember.lastName}`;
			photo = item.FamilyMember.userPhoto;
			// Get phone number from the associated User if it exists
			phoneNumber = item.FamilyMember.creator.phoneNumber || '';
		} else if (item.attendee) {
			name = `${item.attendee.firstName} ${item.attendee.lastName}`;
			photo = item.attendee.userPhoto;
			phoneNumber = item.User?.phoneNumber || '';
		}

		const handleUserPress = () => {
			if (phoneNumber) {
				setSelectedUser({
					name: name,
					phoneNumber: phoneNumber.replace(/\D/g, ''), // Clean the phone number
				});
				setIsModalVisible(true);
			}
		};

		return (
			<TouchableOpacity
				style={styles.checkedInUser}
				onPress={handleUserPress}>
				<Image
					source={
						photo
							? { uri: photo }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.userPhoto}
				/>
				<View style={styles.userInfo}>
					<Text
						style={[styles.userName, { color: colors.textWhite }]}>
						{name}
					</Text>
					{phoneNumber ? (
						<Text
							style={[
								styles.userPhone,
								{ color: colors.textWhite },
							]}>
							{formatPhoneNumber(phoneNumber)}
						</Text>
					) : null}
				</View>
			</TouchableOpacity>
		);
	};

	const renderPlanCard = ({ item }) => (
		<TouchableOpacity
			style={[
				styles.planCard,
				{ backgroundColor: 'rgba(255, 255, 255, 0.1)' },
			]}
			onPress={() => {
				navigation.navigate('PlanView', {
					planId: item.id,
				});
			}}>
			<Text style={[styles.planTitle, { color: colors.textWhite }]}>
				{item.mainTitle}
			</Text>
			<Text style={[styles.planDescription, { color: colors.textWhite }]}>
				{item.description.length > 100
					? item.description.slice(0, 100) + '...'
					: item.description}
			</Text>
			<View style={styles.planCreator}>
				<Image
					source={
						item.creator.userPhoto
							? { uri: item.creator.userPhoto }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.creatorPhoto}
				/>
				<Text style={[styles.creatorName, { color: colors.textWhite }]}>
					{`${item.creator.firstName} ${item.creator.lastName}`}
				</Text>
			</View>
		</TouchableOpacity>
	);

	const renderTeamItem = ({ item }) => {
		const isExpanded = expandedTeams[item.id];
		const ministryId = item.Ministries?.[0]?.id;
		const ministryCheckIns = checkIns[ministryId] || [];
		const plans = teamPlans[item.id] || [];
		const isLoading = loading[item.id];

		return (
			<View
				style={[styles.teamCard, { backgroundColor: colors.primary }]}>
				<TouchableOpacity
					style={styles.teamHeader}
					onPress={() => toggleTeam(item.id)}>
					<View style={styles.teamHeaderContent}>
						<Text style={styles.teamName}>{item.name}</Text>
						<Icon
							name={isExpanded ? 'chevron-up' : 'chevron-down'}
							size={24}
							color='white'
						/>
					</View>
					<Text style={styles.teamDescription}>
						{item.description}
					</Text>
					<Text style={styles.organizationName}>
						{item.organization?.name}
					</Text>
				</TouchableOpacity>

				{isExpanded && (
					<>
						{/* QR checkout: team member scans guardian's pickup QR when ministry requires it */}
						{ministryId &&
							ministryDetails[ministryId]?.requireQrCheckout && (
								<View style={styles.scanCheckoutSection}>
									<Text
										style={[
											styles.scanCheckoutCaption,
											{ color: colors.textWhite },
										]}>
										Scan guardian's pickup QR to verify
										checkout
									</Text>
									<Button
										type='secondary'
										text={
											verifyLoading
												? 'Verifying…'
												: 'Scan QR to checkout'
										}
										onPress={() =>
											handleOpenScanCheckout(ministryId)
										}
										disabled={verifyLoading}
										primaryColor={colors.textWhite}
										style={styles.scanCheckoutButton}
									/>
								</View>
							)}

						{/* Add Plans Section */}
						<View style={styles.plansContainer}>
							<Text
								style={[
									styles.sectionTitle,
									{ color: colors.textWhite },
								]}>
								Published Plans
							</Text>
							{isLoading ? (
								<Text style={styles.loadingText}>
									Loading...
								</Text>
							) : plans.length > 0 ? (
								<FlatList
									data={plans}
									renderItem={renderPlanCard}
									keyExtractor={(plan) => plan.id.toString()}
									scrollEnabled={false}
								/>
							) : (
								<Text style={styles.noPlansText}>
									No published plans available
								</Text>
							)}
						</View>

						{/* Existing check-ins section */}
						<View style={styles.checkInsContainer}>
							<Text style={styles.checkInsTitle}>
								Currently Checked In:
							</Text>
							{isLoading ? (
								<Text style={styles.loadingText}>
									Loading...
								</Text>
							) : ministryCheckIns.length > 0 ? (
								<FlatList
									data={ministryCheckIns}
									renderItem={renderCheckedInPerson}
									keyExtractor={(item) => item.id.toString()}
									scrollEnabled={false}
								/>
							) : (
								<Text style={styles.noCheckInsText}>
									No one is currently checked in
								</Text>
							)}
						</View>
					</>
				)}
			</View>
		);
	};

	return (
		<Background
			primaryColor={colors.primary}
			secondaryColor={colors.secondary}>
			<ScrollView style={styles.container}>
				<View style={styles.headerRow}>
					<Text style={[styles.title, { color: colors.text }]}>
						My Teams
					</Text>
					<TouchableOpacity
						style={[
							styles.myScheduleButton,
							{
								backgroundColor:
									organization?.primaryColor ||
									colors.primary,
							},
						]}
						onPress={handleViewMySchedule}>
						<Icon
							name='calendar-clock'
							size={18}
							color='#FFFFFF'
						/>
						<Text style={styles.myScheduleButtonText}>
							My Schedule
						</Text>
					</TouchableOpacity>
				</View>

				{/* Calendar */}
				<View
					style={[
						styles.calendarContainer,
						{ backgroundColor: colors.primary },
					]}>
					<Calendar
						onDayPress={handleDayPress}
						markedDates={markedDates}
						markingType={'multi-dot'}
						hideExtraDays={true}
						theme={{
							backgroundColor: colors.primary,
							calendarBackground: colors.primary,
							textSectionTitleColor: '#fff',
							selectedDayBackgroundColor:
								organization?.primaryColor || colors.primary,
							selectedDayTextColor: '#fff',
							todayTextColor: '#fff',
							todayBackgroundColor:
								organization?.secondaryColor ||
								colors.secondary,
							dayTextColor: '#fff',
							textDisabledColor: 'rgba(255, 255, 255, 0.3)',
							dotColor: '#fff',
							selectedDotColor: '#fff',
							arrowColor: '#fff',
							monthTextColor: '#fff',
							indicatorColor: '#fff',
							textDayHeaderFontColor: '#fff',
							textDayFontWeight: '400',
							textMonthFontWeight: 'bold',
							textDayHeaderFontWeight: '600',
							textDayFontSize: 16,
							textMonthFontSize: 18,
							textDayHeaderFontSize: 13,
							'stylesheet.dot': {
								base: {
									width: 4,
									height: 4,
									borderRadius: 2,
									borderWidth: 1,
									borderColor: '#808080',
									marginHorizontal: 0.5,
								},
							},
						}}
						style={styles.calendar}
						monthFormat={'MMMM yyyy'}
					/>
					{/* Legend */}
					<View style={styles.legend}>
						<View style={styles.legendItem}>
							<View
								style={[
									styles.legendDot,
									{
										backgroundColor: '#fa8c16',
										borderColor: '#808080',
										borderWidth: 1,
									},
								]}
							/>
							<Text style={styles.legendText}>Pending</Text>
						</View>
						<View style={styles.legendItem}>
							<View
								style={[
									styles.legendDot,
									{
										backgroundColor: '#52c41a',
										borderColor: '#808080',
										borderWidth: 1,
									},
								]}
							/>
							<Text style={styles.legendText}>Approved</Text>
						</View>
						<View style={styles.legendItem}>
							<View
								style={[
									styles.legendDot,
									{
										backgroundColor: '#ff4d4f',
										borderColor: '#808080',
										borderWidth: 1,
									},
								]}
							/>
							<Text style={styles.legendText}>
								Blocked/My Swap
							</Text>
						</View>
						<View style={styles.legendItem}>
							<View
								style={[
									styles.legendDot,
									{
										backgroundColor: '#9c27b0',
										borderColor: '#808080',
										borderWidth: 1,
									},
								]}
							/>
							<Text style={styles.legendText}>Other Swap</Text>
						</View>
					</View>
				</View>

				<FlatList
					data={teams}
					renderItem={renderTeamItem}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={styles.listContainer}
					scrollEnabled={false}
				/>
				<ContactModal />
			</ScrollView>
			<CheckInQRScanner
				visible={scannerVisible}
				onClose={() => {
					setScannerVisible(false);
					setScannerMinistryId(null);
				}}
				onScan={handleScanCheckoutResult}
			/>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	title: {
		...typography.h1,
		flex: 1,
	},
	myScheduleButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		gap: 8,
	},
	myScheduleButtonText: {
		...typography.body,
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	calendarContainer: {
		marginBottom: 20,
		borderRadius: 12,
		overflow: 'hidden',
	},
	calendar: {
		borderRadius: 10,
	},
	legend: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 16,
		marginBottom: 12,
		marginHorizontal: 12,
		paddingTop: 16,
		paddingBottom: 8,
		borderTopWidth: 1,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 4,
	},
	legendDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: 6,
	},
	legendText: {
		...typography.bodySmall,
		fontSize: 11,
	},
	listContainer: {
		paddingBottom: 20,
	},
	teamCard: {
		padding: 15,
		borderRadius: 10,
		marginBottom: 15,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	teamHeader: {
		flex: 1,
	},
	teamHeaderContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	teamName: {
		...typography.h3,
		color: 'white',
		marginBottom: 5,
		flex: 1,
	},
	teamDescription: {
		...typography.bodyMedium,
		color: 'white',
		marginBottom: 10,
	},
	organizationName: {
		...typography.bodySmall,
		color: 'white',
		opacity: 0.8,
	},
	scanCheckoutSection: {
		marginTop: 10,
		paddingTop: 10,
		paddingBottom: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.2)',
	},
	scanCheckoutCaption: {
		...typography.bodyMedium,
		marginBottom: 10,
		opacity: 0.95,
	},
	scanCheckoutButton: {
		alignSelf: 'flex-start',
	},
	checkInsContainer: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.2)',
	},
	checkInsTitle: {
		...typography.h4,
		color: 'white',
		marginBottom: 10,
	},
	checkedInUser: {
		paddingVertical: 5,
		flexDirection: 'row',
		alignItems: 'center',
	},
	userPhoto: {
		width: 30,
		height: 30,
		borderRadius: 15,
		marginRight: 10,
	},
	userInfo: {
		flex: 1,
	},
	userName: {
		...typography.bodyMedium,
		color: 'white',
	},
	userPhone: {
		...typography.bodySmall,
		color: 'white',
		opacity: 0.8,
	},
	loadingText: {
		...typography.bodyMedium,
		color: 'white',
		fontStyle: 'italic',
	},
	noCheckInsText: {
		...typography.bodyMedium,
		color: 'white',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContent: {
		padding: 20,
		borderRadius: 10,
		width: '80%',
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	modalTitle: {
		...typography.h3,
		textAlign: 'center',
		marginBottom: 20,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	modalButton: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 15,
		borderRadius: 8,
		flex: 0.45,
	},
	iconCircle: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},
	modalButtonText: {
		...typography.bodyLarge,
		textAlign: 'center',
	},
	cancelButton: {
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	plansContainer: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.2)',
	},
	sectionTitle: {
		...typography.h4,
		color: 'white',
		marginBottom: 10,
	},
	planCard: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
	},
	planTitle: {
		...typography.bodyLarge,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	planDescription: {
		...typography.bodyMedium,
		marginBottom: 8,
	},
	planCreator: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	creatorPhoto: {
		width: 24,
		height: 24,
		borderRadius: 12,
		marginRight: 8,
	},
	creatorName: {
		...typography.bodySmall,
	},
	noPlansText: {
		...typography.bodyMedium,
		color: 'white',
		fontStyle: 'italic',
		opacity: 0.8,
	},
});

export default TeamsScreen;
