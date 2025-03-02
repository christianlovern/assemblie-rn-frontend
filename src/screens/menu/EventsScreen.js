import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import AnnouncementCard from '../../../shared/components/AnnouncementCard';
import EventCard from '../../../shared/components/EventCard';
import CarouselModal from '../../../shared/components/CarouselModal';
import Button from '../../../shared/buttons/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { announcements, events } from '../../../dummyData';
import { dateNormalizer } from '../../../shared/helper/normalizers';

const screenWidth = Dimensions.get('window').width;
const buttonWidth = (screenWidth - 48) / 3; // 48 = padding (16 * 2) + gaps (8 * 2)

const EventsScreen = ({ route }) => {
	const { user, organization } = useData();

	const [activeFilter, setActiveFilter] = useState(() => {
		const filter = route.params?.filter;
		if (filter === 'events' || filter === 'announcements') {
			return filter;
		}
		return null;
	});
	const [selectedDate, setSelectedDate] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [itemType, setItemType] = useState(null);
	const [markedDates, setMarkedDates] = useState({});

	useEffect(() => {
		if (route.params?.filter) {
			setActiveFilter(route.params.filter);
		}
	}, [route.params?.filter]);

	useEffect(() => {
		const getMarkedDates = () => {
			const dates = {};

			// Process events
			events.forEach((event) => {
				const start = new Date(event.startDate);
				const end = new Date(event.endDate);

				for (
					let date = new Date(start);
					date <= end;
					date.setDate(date.getDate() + 1)
				) {
					const dateString = date.toISOString().split('T')[0];
					if (dates[dateString]) {
						// If date already has announcements, add event dot
						dates[dateString].dots.push({
							color: organization.primaryColor,
							key: `event-${event.id}`,
						});
					} else {
						// Create new date entry with event dot
						dates[dateString] = {
							dots: [
								{
									color: organization.primaryColor,
									key: `event-${event.id}`,
								},
							],
						};
					}
				}
			});

			// Process announcements
			announcements.forEach((announcement) => {
				const start = new Date(announcement.displayStartDate);
				const end = new Date(announcement.displayEndDate);

				for (
					let date = new Date(start);
					date <= end;
					date.setDate(date.getDate() + 1)
				) {
					const dateString = date.toISOString().split('T')[0];
					if (dates[dateString]) {
						// If date already exists, add announcement dot
						dates[dateString].dots.push({
							color: organization.secondaryColor,
							key: `announcement-${announcement.id}`,
						});
					} else {
						// Create new date entry with announcement dot
						dates[dateString] = {
							dots: [
								{
									color: organization.secondaryColor,
									key: `announcement-${announcement.id}`,
								},
							],
						};
					}
				}
			});

			// Add selected date styling if exists
			if (selectedDate) {
				dates[selectedDate] = {
					...(dates[selectedDate] || {}),
					selected: true,
					selectedColor: organization.primaryColor,
					dots: dates[selectedDate]?.dots || [],
				};
			}

			return dates;
		};

		setMarkedDates(getMarkedDates());
	}, [selectedDate, events, announcements, organization]);

	const handleItemPress = (item, type) => {
		setSelectedItem({ ...item, type });
		setItemType(type);
		setModalVisible(true);
	};

	const getFilteredItems = () => {
		let items = [];

		if (activeFilter === 'calendar') {
			// ... existing calendar logic ...
		} else {
			if (!activeFilter || activeFilter === 'announcements') {
				items.push(
					...announcements.map((a) => ({
						...a,
						sortDate: a.displayStartDate,
						type: 'announcement',
					}))
				);
			}

			if (!activeFilter || activeFilter === 'events') {
				items.push(
					...events.map((e) => ({
						...e,
						sortDate: e.startDate,
						type: 'events',
					}))
				);
			}
		}

		return items.sort(
			(a, b) => new Date(a.sortDate) - new Date(b.sortDate)
		);
	};

	const renderContent = () => {
		if (activeFilter === 'calendar') {
			return (
				<>
					<Calendar
						onDayPress={(day) => setSelectedDate(day.dateString)}
						markedDates={markedDates}
						markingType={'multi-dot'}
						style={styles.calendar}
					/>

					{selectedDate ? (
						<ScrollView style={styles.contentContainer}>
							{getFilteredItems().length > 0 ? (
								getFilteredItems().map((item) => {
									if (item.type === 'announcement') {
										return (
											<AnnouncementCard
												key={`announcement-${item.id}`}
												announcement={item}
												onPress={() =>
													handleItemPress(
														item,
														'announcement'
													)
												}
												primaryColor={
													organization.primaryColor
												}
												secondaryColor={
													organization.secondaryColor
												}
											/>
										);
									} else {
										return (
											<EventCard
												key={`event-${item.id}`}
												event={item}
												onPress={() =>
													handleItemPress(
														item,
														'events'
													)
												}
												primaryColor={
													organization.primaryColor
												}
											/>
										);
									}
								})
							) : (
								<View style={styles.emptyStateContainer}>
									<Text style={styles.emptyStateText}>
										There are no Events or Announcements for
										the selected day
									</Text>
								</View>
							)}
						</ScrollView>
					) : (
						<View style={styles.emptyStateContainer}>
							<Text style={styles.emptyStateText}>
								Select a date to view Events and Announcements
							</Text>
						</View>
					)}
				</>
			);
		}

		return (
			<ScrollView style={styles.contentContainer}>
				{getFilteredItems().map((item) => {
					if (item.type === 'announcement') {
						return (
							<AnnouncementCard
								key={`announcement-${item.id}`}
								announcement={item}
								onPress={() =>
									handleItemPress(item, 'announcement')
								}
								primaryColor={organization.primaryColor}
								secondaryColor={organization.secondaryColor}
							/>
						);
					} else {
						return (
							<EventCard
								key={`event-${item.id}`}
								event={item}
								onPress={() => handleItemPress(item, 'events')}
								primaryColor={organization.primaryColor}
							/>
						);
					}
				})}
			</ScrollView>
		);
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<View style={styles.filterContainer}>
					<Button
						type={activeFilter === 'events' ? 'primary' : 'hollow'}
						text='Events'
						primaryColor={organization.primaryColor}
						onPress={() =>
							setActiveFilter(
								activeFilter === 'events' ? null : 'events'
							)
						}
						style={styles.filterButton}
					/>
					<Button
						type={
							activeFilter === 'announcements'
								? 'primary'
								: 'hollow'
						}
						text='Announcements'
						primaryColor={organization.primaryColor}
						onPress={() =>
							setActiveFilter(
								activeFilter === 'announcements'
									? null
									: 'announcements'
							)
						}
						style={styles.filterButton}
					/>
					<Button
						type={
							activeFilter === 'calendar' ? 'primary' : 'hollow'
						}
						icon={
							<Icon
								name='calendar-month'
								size={24}
								color='white'
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() =>
							setActiveFilter(
								activeFilter === 'calendar' ? null : 'calendar'
							)
						}
						style={styles.filterButton}
					/>
				</View>

				{renderContent()}
				{selectedItem && itemType && (
					<CarouselModal
						visible={modalVisible}
						onRequestClose={() => setModalVisible(false)}
						data={selectedItem}
						type={itemType}
					/>
				)}
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		marginTop: '8%',
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
		gap: 8,
	},
	filterButton: {
		minWidth: '25%',
		minHeight: 45,
		paddingHorizontal: 15,
	},
	contentContainer: {
		flex: 1,
	},
	calendar: {
		borderRadius: 10,
		elevation: 4,
		marginBottom: 16,
		padding: 10,
	},
	text: {
		fontSize: 16,
	},
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 40,
	},
	emptyStateText: {
		fontSize: 16,
		textAlign: 'center',
		color: 'white',
	},
});

export default EventsScreen;
