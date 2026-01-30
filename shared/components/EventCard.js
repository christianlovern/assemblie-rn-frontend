import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { dateNormalizer } from '../helper/normalizers';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const EventCard = ({ event, onPress, primaryColor }) => {
	const { colorMode } = useTheme();

	const truncatedDescription =
		event.description && event.description.length > 150
			? event.description.substring(0, 147) + '...'
			: event.description || '';

	const textColor = colorMode === 'dark' ? '#FFFFFF' : '#000000';
	const backgroundColor =
		colorMode === 'dark'
			? 'rgba(255, 255, 255, 0.1)'
			: 'rgba(255, 255, 255, 0.9)';

	// New logic to format the actual scheduled time
	const formatScheduledTime = () => {
		// Fallback to visibility start if eventDate isn't set yet
		const targetDate = event.eventDate || event.startDate;

		if (!targetDate) return 'Time TBD';

		const start = new Date(targetDate);

		// Basic Date string (e.g., Feb 15)
		const datePart = start.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});

		// Time string (e.g., 6:00 PM)
		const timePart = start.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
		});

		// If there's an end time on the same day, show the range
		if (event.eventEndDate) {
			const end = new Date(event.eventEndDate);
			if (start.toDateString() === end.toDateString()) {
				const endTimePart = end.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
				});
				return `${datePart} • ${timePart} - ${endTimePart}`;
			}
		}

		return `${datePart} • ${timePart}`;
	};

	return (
		<TouchableOpacity
			style={[styles.cardContainer, { backgroundColor }]}
			onPress={onPress}
			activeOpacity={0.7}>
			<View
				style={[
					styles.leftIndicator,
					{ backgroundColor: primaryColor },
				]}
			/>

			<View style={styles.contentContainer}>
				<Text
					style={[styles.title, { color: textColor }]}
					numberOfLines={2}>
					{event.name}
				</Text>

				{/* Updated Date Section: Showing Scheduled Time */}
				<View style={styles.dateContainer}>
					<Icon
						name='schedule' // Changed from 'event' to 'schedule' for a "time" feel
						size={16}
						color={textColor}
						style={{ opacity: 0.7, marginRight: 6 }}
					/>
					<Text
						style={[styles.date, { color: textColor }]}
						numberOfLines={1}>
						{formatScheduledTime()}
					</Text>
				</View>

				<Text
					style={[styles.description, { color: textColor }]}
					numberOfLines={2}>
					{truncatedDescription}
				</Text>
			</View>

			<View style={styles.chevronContainer}>
				<Icon
					name='chevron-right'
					size={24}
					color={textColor}
					style={{ opacity: 0.5 }}
				/>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	cardContainer: {
		flexDirection: 'row',
		borderRadius: 12,
		marginBottom: 12,
		marginHorizontal: 20,
		overflow: 'hidden',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
		minHeight: 100,
		padding: 10,
	},
	leftIndicator: {
		width: 4,
	},
	contentContainer: {
		flex: 1,
		padding: 16,
		paddingLeft: 26,
		justifyContent: 'center',
	},
	chevronContainer: {
		justifyContent: 'center',
		paddingRight: 16,
	},
	title: {
		...typography.h3,
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 6,
	},
	dateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	date: {
		...typography.bodyMedium,
		fontSize: 12,
		fontWeight: '500',
		opacity: 0.7,
	},
	description: {
		...typography.body,
		fontSize: 14,
		lineHeight: 20,
		opacity: 0.8,
	},
});

export default EventCard;
