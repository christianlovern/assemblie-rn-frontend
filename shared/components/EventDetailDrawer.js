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
	const { user, organization } = useData();
	const { colors, colorMode } = useTheme();
	const navigation = useNavigation();
	const [eventData, setEventData] = useState(data);
	const [calendarSelectVisible, setCalendarSelectVisible] = useState(false);
	const [availableCalendars, setAvailableCalendars] = useState([]);
	const [isRsvpLoading, setIsRsvpLoading] = useState(false);
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));

	useEffect(() => {
		setEventData(data);
	}, [data]);

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
			Calendar.EntityTypes.EVENT
		);
		return calendars.filter((cal) => cal.accessLevel === 'owner');
	};

	const handleAddToCalendar = async () => {
		try {
			const { status } = await Calendar.requestCalendarPermissionsAsync();
			if (status === 'granted') {
				const writableCalendars = await getWritableCalendars();
				setAvailableCalendars(writableCalendars);
				setCalendarSelectVisible(true);
			}
		} catch (error) {
			console.error('Error getting calendars:', error);
		}
	};

	const addToSelectedCalendar = async (calendarId) => {
		try {
			const eventId = await Calendar.createEventAsync(calendarId, {
				title: eventData.name,
				startDate: new Date(eventData.startDate),
				endDate: new Date(eventData.endDate),
				notes: eventData.description,
				location: eventData.eventLocation || eventData.location,
			});

			if (Platform.OS === 'android') {
				await Calendar.openEventInCalendar(eventId);
			}

			setCalendarSelectVisible(false);
		} catch (error) {
			console.error('Error adding event to calendar:', error);
		}
	};

	const handleRSVP = async () => {
		setIsRsvpLoading(true);
		try {
			const response = await eventsApi.rsvp(eventData.id);
			setEventData(response.event);
		} catch (error) {
			console.error('Error RSVPing to event:', error);
		} finally {
			setIsRsvpLoading(false);
		}
	};

	const isUserRSVPed = eventData?.rsvpUsers?.some(
		(rsvpUser) => rsvpUser.id === user?.id
	);

	// Format date - if start and end are the same, just show once
	const formatDate = () => {
		if (type === 'events') {
			if (!eventData.startDate) return 'Date TBD';
			if (eventData.endDate) {
				const start = new Date(eventData.startDate);
				const end = new Date(eventData.endDate);
				const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
				const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
				
				if (startDateOnly.getTime() === endDateOnly.getTime()) {
					return dateNormalizer(eventData.startDate);
				} else {
					return `${dateNormalizer(eventData.startDate)} - ${dateNormalizer(eventData.endDate)}`;
				}
			}
			return dateNormalizer(eventData.startDate);
		} else {
			// Announcements
			if (!eventData.displayStartDate) return 'Date TBD';
			if (eventData.displayEndDate) {
				const start = new Date(eventData.displayStartDate);
				const end = new Date(eventData.displayEndDate);
				const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
				const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
				
				if (startDateOnly.getTime() === endDateOnly.getTime()) {
					return dateNormalizer(eventData.displayStartDate);
				} else {
					return `${dateNormalizer(eventData.displayStartDate)} - ${dateNormalizer(eventData.displayEndDate)}`;
				}
			}
			return dateNormalizer(eventData.displayStartDate);
		}
	};

	const RSVPSection = () => {
		if (!eventData?.rsvpUsers?.length) {
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
								uri: rsvpUser.userPhoto || rsvpUser.user?.userPhoto,
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
			animationType="fade"
			onRequestClose={() => setCalendarSelectVisible(false)}>
			<View style={styles.calendarModalOverlay}>
				<View
					style={[
						styles.calendarModalContent,
						{ backgroundColor: organization.primaryColor },
					]}>
					<Text style={styles.calendarModalTitle}>Select Calendar</Text>
					<ScrollView>
						{availableCalendars.map((calendar) => (
							<TouchableOpacity
								key={calendar.id}
								style={styles.calendarItem}
								onPress={() => addToSelectedCalendar(calendar.id)}>
								<Text style={styles.calendarItemText}>
									{calendar.title || calendar.name}
								</Text>
								{calendar.source && (
									<Text style={styles.calendarSourceText}>
										{calendar.source.name}
									</Text>
								)}
							</TouchableOpacity>
						))}
					</ScrollView>
					<TouchableOpacity
						style={styles.calendarCancelButton}
						onPress={() => setCalendarSelectVisible(false)}>
						<Text style={styles.calendarCancelText}>Cancel</Text>
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
				animationType="none"
				onRequestClose={onRequestClose}>
				<View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
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
								style={[styles.drawerTitle, { color: colors.text }]}
								numberOfLines={1}>
								{type === 'events' ? 'Event Details' : 'Announcement'}
							</Text>
							<TouchableOpacity
								onPress={onRequestClose}
								style={styles.closeButton}>
								<Icon name="close" size={28} color={colors.text} />
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
									resizeMode="cover"
								/>
							)}

							{/* Content */}
							<View style={styles.contentContainer}>
								{/* Title */}
								<Text
									style={[styles.title, { color: colors.text }]}
									numberOfLines={3}>
									{eventData.name}
								</Text>

								{/* Date */}
								{(eventData.startDate || eventData.displayStartDate) && (
									<View style={styles.dateContainer}>
										<Icon
											name="event"
											size={20}
											color={colors.primary || organization.primaryColor}
										/>
										<Text
											style={[styles.dateText, { color: colors.textSecondary }]}>
											{formatDate()}
										</Text>
									</View>
								)}

								{/* RSVP Section (Events only) */}
								{type === 'events' && <RSVPSection />}

								{/* Description */}
								<Text
									style={[styles.description, { color: colors.text }]}>
									{eventData.description}
								</Text>

								{/* Location */}
								{(eventData.location || eventData.eventLocation) && (
									<View style={styles.locationContainer}>
										<Icon
											name="location-on"
											size={20}
											color={colors.primary || organization.primaryColor}
										/>
										<Text
											style={[
												styles.locationText,
												{ color: colors.textSecondary },
											]}
											numberOfLines={2}>
											{eventData.location || eventData.eventLocation}
										</Text>
									</View>
								)}

								{/* Action Buttons (Events only) */}
								{type === 'events' && (
									<View style={styles.buttonContainer}>
										<Button
											type="primary"
											text={isUserRSVPed ? 'Cancel RSVP' : 'RSVP Now'}
											primaryColor={organization.primaryColor}
											onPress={handleRSVP}
											loading={isRsvpLoading}
										/>
										<Button
											type="hollow"
											text="Add to Calendar"
											primaryColor={organization.primaryColor}
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
													{ color: colors.primary || organization.primaryColor },
												]}>
												View More Events
											</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						</ScrollView>
					</Animated.View>
				</View>
			</Modal>
			<CalendarSelectionModal />
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
});

export default EventDetailDrawer;
