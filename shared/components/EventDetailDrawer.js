import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	ScrollView,
	Image,
	Modal,
	Pressable,
	TouchableOpacity,
	Platform,
	Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { lightenColor } from '../helper/colorFixer';
import Button from '../buttons/Button';
import * as Calendar from 'expo-calendar';
import { useNavigation } from '@react-navigation/native';
import { dateNormalizer } from '../helper/normalizers';
import { eventsApi } from '../../api/announcementRoutes';
import { typography } from '../styles/typography';

const EventDetailDrawer = ({ visible, onRequestClose, data, type }) => {
	const { user, organization, familyMembers } = useData();
	const { colors, colorMode } = useTheme();
	const [rsvpOpen, setRsvpOpen] = useState(false);
	const [myFamilyRsvp, setMyFamilyRsvp] = useState([]);
	const [selectedMembers, setSelectedMembers] = useState([]);
	const navigation = useNavigation();
	const [eventData, setEventData] = useState(data);
	const [calendarSelectVisible, setCalendarSelectVisible] = useState(false);
	const [isCalendarLoading, setIsCalendarLoading] = useState(false);
	const [availableCalendars, setAvailableCalendars] = useState([]);
	const [isRsvpLoading, setIsRsvpLoading] = useState(false);
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));

	console.log('user', user.isGuest);

	useEffect(() => {
		setEventData(data);
		// we dont want to have to search through the family members to see if they are RSVPed, so we will just set the myFamilyRsvp state to the family members that are RSVPed
		// we also want to include the user if they are RSVPed
		setMyFamilyRsvp([
			...(isUserOrFamilyMemberRSVPed(user.id) ? [user] : []),
			...familyMembers.activeConnections.filter((member) =>
				isUserOrFamilyMemberRSVPed(member.id),
			),
		]);
		console.log('data', data);
	}, [data, familyMembers]);

	useEffect(() => {
		if (rsvpOpen && eventData?.rsvpUsers) {
			// Find everyone in the RSVP list that belongs to this user's managed group
			const currentlyRSVPed = [
				...(isUserOrFamilyMemberRSVPed(user.id, true)
					? [{ ...user, isRealUser: true }]
					: []),
				...familyMembers.activeConnections.filter((member) =>
					isUserOrFamilyMemberRSVPed(member.id, member.isRealUser),
				),
			];
			setSelectedMembers(currentlyRSVPed);
		}
	}, [rsvpOpen]);

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

	const getWritableCalendars = async () => {
		const calendars = await Calendar.getCalendarsAsync(
			Calendar.EntityTypes.EVENT,
		);
		return calendars.filter((cal) => cal.accessLevel === 'owner');
	};

	const toggleSelectedMember = (member) => {
		setSelectedMembers((prev) => {
			// Check if member is already in the array
			const isSelected = prev.some(
				(m) => m.id === member.id && m.isRealUser === member.isRealUser,
			);

			if (isSelected) {
				// Remove them
				return prev.filter(
					(m) =>
						!(
							m.id === member.id &&
							m.isRealUser === member.isRealUser
						),
				);
			} else {
				// Add them
				return [...prev, member];
			}
		});
	};

	const handleAddToCalendar = async () => {
		if (!data?.eventDate) {
			alert('This event does not have a scheduled time yet.');
			return;
		}

		setIsCalendarLoading(true); // TRIGGER LOADING IMMEDIATELY

		try {
			console.log('Checking eventDate for calendar:', data.eventDate);

			const { status } = await Calendar.requestCalendarPermissionsAsync();

			if (status === 'granted') {
				console.log('Calendar permissions granted');
				const allCalendars = await Calendar.getCalendarsAsync(
					Calendar.EntityTypes.EVENT,
				);
				console.log('All calendars:', allCalendars);
				// Filter for calendars the user can actually write to
				const writableCalendars = allCalendars.filter(
					(cal) =>
						cal.allowsModifications ||
						cal.accessLevel ===
							Calendar.CalendarAccessLevel.OWNER ||
						cal.accessLevel === 'owner',
				);
				console.log('Writable calendars:', writableCalendars);
				if (writableCalendars.length === 0) {
					alert('No writable calendars found on this device.');
				} else {
					setAvailableCalendars(writableCalendars);
					setCalendarSelectVisible(true);
				}
			} else {
				alert('Calendar permission is required to add events.');
			}
		} catch (error) {
			console.error('Error getting calendars:', error);
			alert('An error occurred while accessing your calendar.');
		} finally {
			setIsCalendarLoading(false); // STOP LOADING
		}
	};

	const addToSelectedCalendar = async (calendarId) => {
		try {
			const startDate = new Date(data.eventDate);
			const endDate = data.eventEndDate
				? new Date(data.eventEndDate)
				: new Date(startDate.getTime() + 60 * 60 * 1000);

			// This opens the official iOS "New Event" screen
			// It is much more reliable for syncing to Google/Exchange
			await Calendar.createEventInCalendarAsync({
				title: data.name,
				startDate: startDate,
				endDate: endDate,
				notes: data.description,
				location: data.location,
				calendarId: calendarId, // Pre-selects your Gmail calendar
			});

			setCalendarSelectVisible(false);
			// Note: No need for alert() usually, as the user sees the system success
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const handleRSVP = async () => {
		setIsRsvpLoading(true);
		try {
			const payload = selectedMembers.map((m) => ({
				id: m.id,
				firstName: m.firstName,
				lastName: m.lastName,
				userPhoto: m.userPhoto,
				isRealUser: m.isRealUser,
			}));

			const response = await eventsApi.rsvp(eventData.id, payload);

			setEventData(response.event);
			setRsvpOpen(false);
		} catch (error) {
			console.error('Error RSVPing to event:', error);
		} finally {
			setIsRsvpLoading(false);
		}
	};

	const isUserOrFamilyMemberRSVPed = (memberId = null, isRealUser = true) => {
		// 1. If no ID is passed, check if ANYONE in the household (user + active connections) is RSVP'd
		if (!memberId) {
			return eventData?.rsvpUsers?.some((rsvp) => {
				// Check if the RSVP belongs to the logged-in user
				if (rsvp.userId === user?.id) return true;
				// Check if the RSVP matches any of the active family connections
				return familyMembers.activeConnections.some(
					(conn) =>
						(conn.isRealUser && conn.id === rsvp.userId) ||
						(!conn.isRealUser && conn.id === rsvp.familyMemberId),
				);
			});
		}

		// 2. If an ID is passed, check that specific person
		return eventData?.rsvpUsers?.some((rsvp) => {
			if (isRealUser) {
				return rsvp.userId === memberId;
			} else {
				return rsvp.familyMemberId === memberId;
			}
		});
	};

	const formatDate = () => {
		// If it's an Event and we have the actual schedule date
		if (type === 'events' && eventData.eventDate) {
			const start = new Date(eventData.eventDate);

			// Options for a nice display: "Friday, Jan 30 @ 6:00 PM"
			const options = {
				weekday: 'long',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
			};

			if (eventData.eventEndDate) {
				const end = new Date(eventData.eventEndDate);
				const isSameDay = start.toDateString() === end.toDateString();

				if (isSameDay) {
					// Same day: "Friday, Jan 30, 6:00 PM - 8:00 PM"
					const endTime = end.toLocaleTimeString([], {
						hour: 'numeric',
						minute: '2-digit',
					});
					return `${start.toLocaleDateString([], options)} - ${endTime}`;
				} else {
					// Multi-day event
					return `${start.toLocaleDateString([], options)} - ${end.toLocaleDateString([], options)}`;
				}
			}
			return start.toLocaleDateString([], options);
		}

		// Fallback for Announcements or Events missing the new field
		const displayStart = eventData.displayStartDate || eventData.startDate;
		const displayEnd = eventData.displayEndDate || eventData.endDate;

		if (!displayStart) return 'Date TBD';

		return displayEnd && displayStart !== displayEnd
			? `${dateNormalizer(displayStart)} - ${dateNormalizer(displayEnd)}`
			: dateNormalizer(displayStart);
	};

	const RSVPSection = () => {
		if (!eventData?.rsvpUsers?.length || user?.isGuest) {
			return null;
		}

		const firstFiveUsers = eventData.rsvpUsers.slice(0, 5);
		const remainingCount = Math.max(0, eventData.rsvpUsers.length - 5);

		return (
			<View style={styles.rsvpContainer}>
				<Text style={[styles.rsvpTitle, { color: colors.text }]}>
					RSVPs ({eventData.rsvpUsers.length})
				</Text>
				<View style={styles.rsvpPhotosContainer}>
					{firstFiveUsers.map((rsvpUser, index) => (
						<Image
							key={rsvpUser.id || index}
							source={{
								uri:
									rsvpUser.userPhoto ||
									rsvpUser.user?.userPhoto,
							}}
							style={[
								styles.rsvpPhoto,
								{ marginLeft: index > 0 ? -10 : 0 },
							]}
						/>
					))}
					{remainingCount > 0 && (
						<View style={styles.remainingCount}>
							<Text style={styles.remainingCountText}>
								+{remainingCount}
							</Text>
						</View>
					)}
				</View>
			</View>
		);
	};

	const screenWidth = Dimensions.get('window').width;
	// Drawer width is 85% of screen, so we need to slide it that distance
	const drawerWidth = screenWidth * 0.85;
	const translateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerWidth, 0], // Slide from right (off screen) to visible
	});

	const CalendarSelectionModal = () => (
		<Modal
			visible={calendarSelectVisible}
			transparent={true}
			animationType='fade'
			onRequestClose={() => setCalendarSelectVisible(false)}>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.calendarModalContent,
						{
							backgroundColor:
								colorMode === 'dark' ? '#1A1A1A' : '#FFFFFF',
						},
					]}>
					<View style={styles.modalHeader}>
						<Text
							style={[styles.modalTitle, { color: colors.text }]}>
							Add to Calendar
						</Text>
						<Text style={styles.modalSubtitle}>
							Select which calendar to use:
						</Text>
					</View>

					<View style={styles.calendarList}>
						{availableCalendars.map((cal) => (
							<TouchableOpacity
								key={cal.id}
								style={[
									styles.calendarOption,
									{
										borderBottomColor:
											colorMode === 'dark'
												? '#333'
												: '#EEE',
									},
								]}
								onPress={() => addToSelectedCalendar(cal.id)}>
								<View
									style={[
										styles.colorDot,
										{
											backgroundColor:
												cal.color ||
												organization.primaryColor,
										},
									]}
								/>
								<View style={styles.calendarInfo}>
									<Text
										style={[
											styles.calendarTitle,
											{ color: colors.text },
										]}>
										{cal.title}
									</Text>
									<Text style={styles.calendarAccount}>
										{cal.source?.name || 'Local'}
									</Text>
								</View>
								<Icon
									name='chevron-right'
									size={18}
									color={colors.text}
									style={{ opacity: 0.3 }}
								/>
							</TouchableOpacity>
						))}
					</View>

					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => setCalendarSelectVisible(false)}>
						<Text
							style={[
								styles.closeButtonText,
								{ color: organization.primaryColor },
							]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	if (!eventData) return null;

	return (
		<>
			<Modal
				visible={visible}
				transparent
				animationType='none'
				onRequestClose={onRequestClose}>
				<View
					style={styles.container}
					pointerEvents={visible ? 'auto' : 'none'}>
					<Animated.View
						style={[
							styles.backdrop,
							{
								opacity: backdropOpacity,
							},
						]}
						pointerEvents={visible ? 'auto' : 'none'}>
						<Pressable
							style={styles.backdropPressable}
							onPress={onRequestClose}
						/>
					</Animated.View>
					<Animated.View
						style={[
							styles.drawer,
							{
								transform: [{ translateX }],
								backgroundColor: colors.background || '#1A1A1A',
							},
						]}
						pointerEvents={visible ? 'auto' : 'none'}>
						{/* Header */}
						<View style={styles.drawerHeader}>
							<Text
								style={[
									styles.drawerTitle,
									{ color: colors.text },
								]}
								numberOfLines={1}>
								{type === 'events'
									? 'Event Details'
									: 'Announcement'}
							</Text>
							<TouchableOpacity
								onPress={onRequestClose}
								style={styles.closeButton}>
								<Icon
									name='close'
									size={28}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView
							style={styles.scrollView}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.scrollContent}>
							{/* Cover Image */}
							{eventData.image && (
								<Image
									source={{ uri: eventData.image }}
									style={styles.coverImage}
									resizeMode='cover'
								/>
							)}

							{/* Content */}
							<View style={styles.contentContainer}>
								{/* Title */}
								<Text
									style={[
										styles.title,
										{ color: colors.text },
									]}
									numberOfLines={3}>
									{eventData.name}
								</Text>

								{/* Date */}
								{(eventData.startDate ||
									eventData.displayStartDate) && (
									<View style={styles.dateContainer}>
										<Icon
											name='event'
											size={20}
											color={
												colors.primary ||
												organization.primaryColor
											}
										/>
										<Text
											style={[
												styles.dateText,
												{ color: colors.textSecondary },
											]}>
											{formatDate()}
										</Text>
									</View>
								)}

								{/* RSVP Section (Events only) */}
								{type === 'events' && <RSVPSection />}

								{/* Description */}
								<Text
									style={[
										styles.description,
										{ color: colors.text },
									]}>
									{eventData.description}
								</Text>

								{/* Location */}
								{(eventData.location ||
									eventData.eventLocation) && (
									<View style={styles.locationContainer}>
										<Icon
											name='location-on'
											size={20}
											color={
												colors.primary ||
												organization.primaryColor
											}
										/>
										<Text
											style={[
												styles.locationText,
												{ color: colors.textSecondary },
											]}
											numberOfLines={2}>
											{eventData.location ||
												eventData.eventLocation}
										</Text>
									</View>
								)}

								{/* Action Buttons (Events only) */}
								{type === 'events' && (
									<View style={styles.buttonContainer}>
										{/* Action Button */}
										{!user?.isGuest && (
											<Button
												type='primary'
												// If someone is already RSVP'd, clicking this opens the menu to "Edit"
												text={
													isUserOrFamilyMemberRSVPed()
														? 'Edit Group RSVP'
														: 'RSVP Now'
												}
												primaryColor={
													organization.primaryColor
												}
												onPress={() => {
													if (rsvpOpen) {
														// If they click again while open, treat it as the "Submit" action
														handleRSVP();
													} else {
														setRsvpOpen(true);
													}
												}}
												loading={isRsvpLoading}
											/>
										)}

										{rsvpOpen && (
											<View
												style={
													styles.rsvpModalContainer
												}>
												<Text
													style={[
														styles.rsvpModalTitleText,
														{ color: colors.text },
													]}>
													Select Members
												</Text>
												<ScrollView>
													{/* Logged in User */}
													{user && (
														<TouchableOpacity
															style={
																selectedMembers.some(
																	(m) =>
																		m.id ===
																			user.id &&
																		m.isRealUser,
																)
																	? styles.selectedMember
																	: styles.nonSelectedMember
															}
															key={`user-${user.id}`}
															onPress={() =>
																toggleSelectedMember(
																	{
																		...user,
																		isRealUser: true,
																	},
																)
															}>
															<Image
																source={
																	user.userPhoto
																		? {
																				uri: user.userPhoto,
																			}
																		: require('../../assets/Assemblie_DefaultUserIcon.png')
																}
																style={
																	styles.rsvpModalItemPhoto
																}
															/>
															<Text
																style={[
																	styles.rsvpModalItemText,
																	{
																		color: colors.text,
																	},
																]}>
																{user.firstName}{' '}
																{user.lastName}{' '}
																(Me)
															</Text>
														</TouchableOpacity>
													)}

													{/* Family Members */}
													{familyMembers.activeConnections.map(
														(member) => {
															// Check against the local state array for immediate UI feedback
															const isSelected =
																selectedMembers.some(
																	(m) =>
																		m.id ===
																			member.id &&
																		m.isRealUser ===
																			member.isRealUser,
																);

															return (
																<TouchableOpacity
																	style={
																		isSelected
																			? styles.selectedMember
																			: styles.nonSelectedMember
																	}
																	key={`member-${member.id}`}
																	onPress={() =>
																		toggleSelectedMember(
																			member,
																		)
																	}>
																	<Image
																		source={
																			member.userPhoto
																				? {
																						uri: member.userPhoto,
																					}
																				: require('../../assets/Assemblie_DefaultUserIcon.png')
																		}
																		style={
																			styles.rsvpModalItemPhoto
																		}
																	/>
																	<Text
																		style={[
																			styles.rsvpModalItemText,
																			{
																				color: colors.text,
																			},
																		]}>
																		{
																			member.firstName
																		}{' '}
																		{
																			member.lastName
																		}
																	</Text>
																</TouchableOpacity>
															);
														},
													)}
												</ScrollView>
											</View>
										)}
										<Button
											type='hollow'
											text='Add to Calendar'
											loading={isCalendarLoading}
											primaryColor={
												organization.primaryColor
											}
											onPress={handleAddToCalendar}
										/>
										<TouchableOpacity
											onPress={() => {
												onRequestClose();
												navigation.navigate('Events');
											}}
											style={styles.viewMoreButton}>
											<Text
												style={[
													styles.viewMoreText,
													{
														color:
															colors.primary ||
															organization.primaryColor,
													},
												]}>
												View More Events
											</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						</ScrollView>
						<CalendarSelectionModal />
					</Animated.View>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	backdropPressable: {
		flex: 1,
	},
	drawer: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: '85%',
		maxWidth: 400,
		shadowColor: '#000',
		shadowOffset: {
			width: -2,
			height: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	drawerHeader: {
		paddingTop: Platform.OS === 'ios' ? 50 : 20,
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	drawerTitle: {
		...typography.h3,
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
		marginRight: 12,
	},
	closeButton: {
		padding: 4,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	coverImage: {
		width: '100%',
		height: 200,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	contentContainer: {
		padding: 20,
	},
	title: {
		...typography.h2,
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		lineHeight: 32,
	},
	dateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	dateText: {
		...typography.bodyMedium,
		fontSize: 16,
		marginLeft: 8,
	},
	rsvpContainer: {
		marginBottom: 20,
	},
	rsvpTitle: {
		...typography.bodyMedium,
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 12,
	},
	rsvpPhotosContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	rsvpPhoto: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.3)',
	},
	remainingCount: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: -10,
	},
	remainingCountText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
	},
	description: {
		...typography.body,
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 20,
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 20,
	},
	locationText: {
		...typography.bodyMedium,
		fontSize: 16,
		marginLeft: 8,
		flex: 1,
	},
	buttonContainer: {
		gap: 12,
		marginTop: 8,
	},
	viewMoreButton: {
		alignItems: 'center',
		padding: 12,
	},
	viewMoreText: {
		...typography.bodyMedium,
		fontSize: 16,
		fontWeight: '600',
		textDecorationLine: 'underline',
	},
	calendarModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	calendarModalContent: {
		width: '80%',
		maxHeight: '70%',
		borderRadius: 15,
		padding: 20,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	calendarModalTitle: {
		...typography.h3,
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
		color: 'white',
	},
	calendarItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.2)',
	},
	calendarItemText: {
		...typography.body,
		fontSize: 16,
		color: 'white',
	},
	calendarSourceText: {
		...typography.body,
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.7)',
		marginTop: 4,
	},
	calendarCancelButton: {
		marginTop: 20,
		padding: 15,
		alignItems: 'center',
	},
	calendarCancelText: {
		...typography.bodyMedium,
		fontSize: 16,
		color: 'rgba(255, 255, 255, 0.8)',
	},
	selectedMember: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: 'rgba(0, 128, 0, 0.2)',
		padding: 10,
		borderRadius: 10,
	},
	nonSelectedMember: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,

		padding: 10,
		borderRadius: 10,
	},
	rsvpModalItemPhoto: {
		width: 32,
		height: 32,
		borderRadius: 16,
	},
	rsvpModalItemText: {
		...typography.bodyMedium,
		fontSize: 16,
	},
	rsvpModalTitleText: {
		...typography.h3,
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	calendarModalContent: {
		width: '100%',
		borderRadius: 20,
		padding: 24,
		maxHeight: '80%',
	},
	modalHeader: {
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	modalSubtitle: {
		fontSize: 14,
		color: '#888',
	},
	calendarList: {
		marginBottom: 10,
	},
	calendarOption: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 15,
		borderBottomWidth: 1,
	},
	colorDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: 12,
	},
	calendarInfo: {
		flex: 1,
	},
	calendarTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	calendarAccount: {
		fontSize: 12,
		color: '#888',
		marginTop: 2,
	},
	closeButton: {
		marginTop: 10,
		paddingVertical: 10,
		alignItems: 'center',
	},
	closeButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});

export default EventDetailDrawer;
