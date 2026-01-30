import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import AnnouncementCard from '../../../shared/components/AnnouncementCard';
import EventCard from '../../../shared/components/EventCard';
import EventDetailDrawer from '../../../shared/components/EventDetailDrawer';
import Button from '../../../shared/buttons/Button';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { typography } from '../../../shared/styles/typography';

const screenWidth = Dimensions.get('window').width;
const buttonWidth = (screenWidth - 48) / 3; // 48 = padding (16 * 2) + gaps (8 * 2)

const EventsScreen = ({ route }) => {
	const { user, organization, announcements, events } = useData();
	const { colorMode } = useTheme();

	if (!user || !organization) {
		return null;
	}
	const [activeFilter, setActiveFilter] = useState(() => {
		const filter = route.params?.filter;
		if (filter === 'events' || filter === 'announcements') {
			return filter;
		}
		return null;
	});
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [itemType, setItemType] = useState(null);
	const [markedDates, setMarkedDates] = useState({});

	useEffect(() => {
		if (route.params?.filter) {
			setActiveFilter(route.params.filter);
		}
		if (route.params?.selectedItem) {
			const item = route.params.selectedItem;
			setSelectedItem(item);
			setItemType(item.type || 'announcement');
			setModalVisible(true);
		}
	}, [route.params?.filter, route.params?.selectedItem]);

	useEffect(() => {
		const getMarkedDates = () => {
			const dates = {};

			// Process events from context
			events?.events?.forEach((event) => {
				const start = new Date(event.startDate);
				const end = new Date(event.endDate);

				for (
					let date = new Date(start);
					date <= end;
					date.setDate(date.getDate() + 1)
				) {
					const dateString = date.toISOString().split('T')[0];
					const eventKey = `event-${event.id}-${dateString}`;

					if (dates[dateString]) {
						// Check if this event dot already exists
						const existingDot = dates[dateString].dots.find(
							(dot) => dot.key === eventKey,
						);
						if (!existingDot) {
							dates[dateString].dots.push({
								color: organization.primaryColor,
								key: eventKey,
							});
						}
					} else {
						dates[dateString] = {
							dots: [
								{
									color: organization.primaryColor,
									key: eventKey,
								},
							],
						};
					}
				}
			});

			// Process announcements from context
			announcements?.announcements?.forEach((announcement) => {
				const start = new Date(announcement.displayStartDate);
				const end = new Date(announcement.displayEndDate);

				for (
					let date = new Date(start);
					date <= end;
					date.setDate(date.getDate() + 1)
				) {
					const dateString = date.toISOString().split('T')[0];
					const announcementKey = `announcement-${announcement.id}-${dateString}`;

					if (dates[dateString]) {
						// Check if this announcement dot already exists
						const existingDot = dates[dateString].dots.find(
							(dot) => dot.key === announcementKey,
						);
						if (!existingDot) {
							dates[dateString].dots.push({
								color: organization.secondaryColor,
								key: announcementKey,
							});
						}
					} else {
						dates[dateString] = {
							dots: [
								{
									color: organization.secondaryColor,
									key: announcementKey,
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

		// Handle announcements
		if (
			activeFilter === 'announcements' ||
			activeFilter === 'calendar' ||
			!activeFilter
		) {
			const filteredAnnouncements = (
				announcements?.announcements || []
			).filter((a) => {
				// Only apply date filter in calendar view
				if (activeFilter === 'calendar' && selectedDate) {
					const start = new Date(a.displayStartDate);
					const end = new Date(a.displayEndDate);
					const selected = new Date(selectedDate);
					return selected >= start && selected <= end;
				}
				return true;
			});

			items.push(
				...filteredAnnouncements.map((a) => ({
					...a,
					sortDate: a.displayStartDate,
					type: 'announcement',
				})),
			);
		}

		// Handle events
		if (
			activeFilter === 'events' ||
			activeFilter === 'calendar' ||
			!activeFilter
		) {
			const filteredEvents = (events?.events || []).filter((e) => {
				// Only apply date filter in calendar view
				if (activeFilter === 'calendar' && selectedDate) {
					const start = new Date(e.startDate);
					const end = new Date(e.endDate);
					const selected = new Date(selectedDate);
					return selected >= start && selected <= end;
				}
				return true;
			});

			items.push(
				...filteredEvents.map((e) => ({
					...e,
					sortDate: e.startDate,
					type: 'events',
				})),
			);
		}

		return items.sort(
			(a, b) => new Date(a.sortDate) - new Date(b.sortDate),
		);
	};

	const renderContent = () => {
		if (activeFilter === 'calendar') {
			return (
				<>
					<Calendar
						onDayPress={(day) => {
							setSelectedDate(day.dateString);
						}}
						markedDates={markedDates}
						markingType={'multi-dot'}
						style={styles.calendar}
						monthFormat={'MMMM yyyy'}
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
														'announcement',
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
														'events',
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
							<Text
								style={[
									styles.emptyStateText,
									{ color: colors.text },
								]}>
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
						icon={
							<Icon
								name='event'
								size={24}
								color={
									colorMode === 'light'
										? activeFilter === 'events'
											? 'white'
											: organization.primaryColor
										: 'white'
								}
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() =>
							setActiveFilter(
								activeFilter === 'events' ? null : 'events',
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
						icon={
							<Icon
								name='campaign'
								size={24}
								color={
									colorMode === 'light'
										? activeFilter === 'announcements'
											? 'white'
											: organization.primaryColor
										: 'white'
								}
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() =>
							setActiveFilter(
								activeFilter === 'announcements'
									? null
									: 'announcements',
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
								color={
									colorMode === 'light'
										? activeFilter === 'calendar'
											? 'white'
											: organization.primaryColor
										: 'white'
								}
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() =>
							setActiveFilter(
								activeFilter === 'calendar' ? null : 'calendar',
							)
						}
						style={styles.filterButton}
					/>
				</View>

				{renderContent()}
				{selectedItem && itemType && (
					<EventDetailDrawer
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
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
		gap: 8,
	},
	filterButton: {
		flex: 1,
		minWidth: buttonWidth,
		height: 50, // Ensure consistent height
		justifyContent: 'center',
		alignItems: 'center',
	},
	calendar: {
		borderRadius: 10,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		marginBottom: 16,
	},
	contentContainer: {
		flex: 1,
		borderRadius: 10,
	},
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyStateText: {
		...typography.body,
		textAlign: 'center',
	},
});

export default EventsScreen;
