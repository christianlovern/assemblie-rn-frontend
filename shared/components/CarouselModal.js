import React, { useEffect, useState } from 'react';
import {
	View,
	Modal,
	StyleSheet,
	TouchableWithoutFeedback,
	Text,
	Image,
	TouchableOpacity,
	Platform,
	FlatList,
	ScrollView,
} from 'react-native';
import { useData } from '../../context';
import { lightenColor } from '../helper/colorFixer';
import Button from '../buttons/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Calendar from 'expo-calendar';
import { useNavigation } from '@react-navigation/native';
import { dateNormalizer } from '../helper/normalizers';

const CarouselModal = ({ visible, onRequestClose, data, type }) => {
	const { user, organization } = useData();
	const [eventData, setEventData] = React.useState(data);
	const [calendarSelectVisible, setCalendarSelectVisible] = useState(false);
	const [availableCalendars, setAvailableCalendars] = useState([]);
	const navigation = useNavigation();

	console.log('Modal Type:', type);

	useEffect(() => {
		setEventData(data);
	}, [data]);

	const updateEventRSVP = (eventId, updatedRsvpUsers) => {
		setEventData((prev) => ({
			...prev,
			rsvpUser: updatedRsvpUsers,
		}));
	};

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
			const startDate = new Date(eventData.startDate);
			const endDate = new Date(eventData.endDate);

			if (startDate.getTime() === endDate.getTime()) {
				endDate.setHours(endDate.getHours() + 1);
			}

			const eventDetails = {
				title: eventData.name,
				startDate: startDate,
				endDate: endDate,
				notes: eventData.description || '',
				location: eventData.location || '',
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				alarms: [
					{
						relativeOffset: -60,
					},
				],
				// Add these fields to improve sync and visibility
				availability: Calendar.Availability.BUSY,
				status: Calendar.EventStatus.CONFIRMED,
				accessLevel: Calendar.CalendarAccessLevel.OWNER,
				organizer: {
					name: user.name || 'Event Organizer',
					email: availableCalendars.find(
						(cal) => cal.id === calendarId
					)?.source?.name,
				},
			};

			console.log('Adding event to calendar with details:', {
				calendarId,
				selectedCalendar: availableCalendars.find(
					(cal) => cal.id === calendarId
				),
				eventDetails: {
					...eventDetails,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
				},
			});

			const eventId = await Calendar.createEventAsync(
				calendarId,
				eventDetails
			);
			console.log('Successfully created event:', {
				eventId,
				calendarId,
				calendarName: availableCalendars.find(
					(cal) => cal.id === calendarId
				)?.name,
				title: eventDetails.title,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			});

			// Force a calendar refresh
			if (Platform.OS === 'android') {
				await Calendar.openEventInCalendar(eventId);
			}

			setCalendarSelectVisible(false);
		} catch (error) {
			console.error('Error adding event to calendar:', error);
			console.error('Error details:', {
				message: error.message,
				stack: error.stack,
				eventData,
				calendarId,
			});
		}
	};

	const CalendarSelectionModal = () => (
		<Modal
			visible={calendarSelectVisible}
			transparent={true}
			animationType='slide'
			onRequestClose={() => setCalendarSelectVisible(false)}>
			<TouchableWithoutFeedback
				onPress={() => setCalendarSelectVisible(false)}>
				<View style={styles.modalOverlay}>
					<TouchableWithoutFeedback>
						<View
							style={[
								styles.calendarModalContent,
								{ backgroundColor: organization.primaryColor },
							]}>
							<Text style={styles.calendarModalTitle}>
								Select Calendar
							</Text>
							<FlatList
								data={availableCalendars}
								keyExtractor={(item) => item.id}
								renderItem={({ item }) => (
									<TouchableOpacity
										style={styles.calendarItem}
										onPress={() =>
											addToSelectedCalendar(item.id)
										}>
										<Text style={styles.calendarName}>
											{item.name}
										</Text>
										<Text style={styles.calendarSource}>
											{item.source.name}
										</Text>
									</TouchableOpacity>
								)}
							/>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);

	if (eventData) {
		return (
			<>
				<Modal
					visible={visible}
					transparent={true}
					onRequestClose={onRequestClose}
					animationType='fade'>
					<View style={styles.modalOverlay}>
						<View
							style={[
								styles.modalContent,
								{ backgroundColor: organization.primaryColor },
							]}>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={onRequestClose}>
								<Icon
									name='close'
									size={24}
									color={organization.primaryColor}
								/>
							</TouchableOpacity>

							<ScrollView
								style={styles.scrollView}
								showsVerticalScrollIndicator={true}>
								{eventData.image && (
									<Image
										source={eventData.image}
										style={styles.coverImage}
										resizeMode='cover'
									/>
								)}

								<View style={styles.contentContainer}>
									{eventData.startDate && (
										<View style={styles.dateContainer}>
											<Icon
												name='calendar-month'
												size={20}
												color={lightenColor(
													organization.primaryColor
												)}
											/>
											<Text style={styles.dateText}>
												{type === 'events'
													? `${dateNormalizer(
															eventData.startDate
													  )} - ${dateNormalizer(
															eventData.endDate
													  )}`
													: `${dateNormalizer(
															eventData.displayStartDate
													  )} - ${dateNormalizer(
															eventData.displayEndDate
													  )}`}
											</Text>
										</View>
									)}

									{/* RSVP count for events */}
									{type === 'events' && (
										<View style={styles.rsvpContainer}>
											<Text style={styles.rsvpText}>
												RSVP Total ={' '}
												{eventData.rsvpUser?.length ||
													0}
											</Text>
										</View>
									)}

									<Text style={styles.title}>
										{eventData.name}
									</Text>

									<Text style={styles.description}>
										{eventData.description}
									</Text>

									{eventData.location && (
										<View style={styles.locationContainer}>
											<Icon
												name='location-pin'
												size={20}
												color={lightenColor(
													organization.primaryColor
												)}
											/>
											<Text style={styles.locationText}>
												{eventData.location}
											</Text>
										</View>
									)}

									{/* Button container inside ScrollView */}
									{type === 'events' && (
										<View style={styles.buttonContainer}>
											<Button
												type='primary'
												text='RSVP Now'
												primaryColor={
													organization.primaryColor
												}
												onPress={() => {
													const isRSVPed =
														eventData.rsvpUser?.includes(
															user.id
														);
													if (!isRSVPed) {
														const updatedRsvpUsers =
															[
																...(eventData.rsvpUser ||
																	[]),
																user.id,
															];
														updateEventRSVP(
															eventData.id,
															updatedRsvpUsers
														);
													}
												}}
											/>
											<Button
												type='hollow'
												text='Add to Calendar'
												primaryColor={
													organization.primaryColor
												}
												onPress={handleAddToCalendar}
											/>
											<TouchableOpacity
												onPress={() => {
													onRequestClose();
													navigation.navigate(
														'Events'
													);
												}}
												style={styles.viewMoreButton}>
												<Text
													style={styles.viewMoreText}>
													View More Events
												</Text>
											</TouchableOpacity>
										</View>
									)}
								</View>
							</ScrollView>
						</View>
					</View>
				</Modal>
				<CalendarSelectionModal />
			</>
		);
	}
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		height: '85%',
		borderRadius: 15,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		width: '85%',
		overflow: 'hidden',
	},
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		padding: 15,
	},
	coverImage: {
		width: '100%',
		height: 250,
	},
	dateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
		flexWrap: 'wrap',
	},
	dateText: {
		marginLeft: 8,
		fontSize: 16,
		color: 'white',
		flexShrink: 1,
	},
	rsvpContainer: {
		marginTop: 10,
		marginBottom: 15,
	},
	rsvpText: {
		color: 'white',
		fontSize: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: 'white',
		marginBottom: 10,
		flexWrap: 'wrap',
		width: '100%',
	},
	description: {
		fontSize: 16,
		color: 'white',
		marginBottom: 20,
		lineHeight: 24,
		flexWrap: 'wrap',
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 20,
		marginHorizontal: 20,
	},
	locationText: {
		color: 'white',
		marginLeft: 10,
		fontSize: 16,
	},
	buttonContainer: {
		width: '85%',
		paddingVertical: 20,
		alignSelf: 'center',
		marginTop: 20,
	},
	viewMoreButton: {
		alignItems: 'center',
		padding: 10,
		marginTop: 10,
	},
	viewMoreText: {
		fontSize: 16,
		textDecorationLine: 'underline',
		color: 'white',
	},
	closeButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		padding: 5,
		zIndex: 1,
		backgroundColor: 'white',
		borderRadius: 15,
	},
	calendarModalContent: {
		width: '80%',
		maxHeight: '70%',
		backgroundColor: 'white',
		borderRadius: 15,
		padding: 20,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	calendarModalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 15,
		color: 'white',
		textAlign: 'center',
	},
	calendarItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.2)',
	},
	calendarName: {
		fontSize: 16,
		color: 'white',
		fontWeight: '500',
	},
	calendarSource: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.7)',
		marginTop: 4,
	},
});

export default CarouselModal;
