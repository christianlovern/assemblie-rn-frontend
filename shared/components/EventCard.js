import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { dateNormalizer } from '../helper/normalizers';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const EventCard = ({ event, onPress, primaryColor }) => {
	const { colors, colorMode } = useTheme();

	const truncatedDescription =
		event.description && event.description.length > 150
			? event.description.substring(0, 147) + '...'
			: event.description || '';

	const textColor = colorMode === 'dark' ? '#FFFFFF' : '#000000';
	const backgroundColor = colorMode === 'dark' 
		? 'rgba(255, 255, 255, 0.1)' 
		: 'rgba(255, 255, 255, 0.9)';

	// Format event date - if start and end are the same, just show once
	const eventDate = (() => {
		if (!event.startDate) {
			return 'Date TBD';
		}
		
		if (event.endDate) {
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			// Compare dates (ignoring time)
			const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
			const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
			
			if (startDateOnly.getTime() === endDateOnly.getTime()) {
				// Same date, just show once
				return dateNormalizer(event.startDate);
			} else {
				// Different dates, show range
				return `${dateNormalizer(event.startDate)} - ${dateNormalizer(event.endDate)}`;
			}
		}
		
		return dateNormalizer(event.startDate);
	})();

	return (
		<TouchableOpacity
			style={[
				styles.cardContainer,
				{ backgroundColor },
			]}
			onPress={onPress}
			activeOpacity={0.7}>
			{/* Left side shadow/indicator */}
			<View
				style={[
					styles.leftIndicator,
					{ backgroundColor: primaryColor },
				]}
			/>
			
			{/* Content */}
			<View style={styles.contentContainer}>
				<Text
					style={[styles.title, { color: textColor }]}
					numberOfLines={2}>
					{event.name}
				</Text>
				<View style={styles.dateContainer}>
					<Icon
						name="event"
						size={16}
						color={textColor}
						style={{ opacity: 0.7, marginRight: 6 }}
					/>
					<Text
						style={[styles.date, { color: textColor }]}
						numberOfLines={1}>
						{eventDate}
					</Text>
				</View>
				<Text
					style={[styles.description, { color: textColor }]}
					numberOfLines={3}>
					{truncatedDescription}
				</Text>
			</View>
			
			{/* Tap indicator */}
			<View style={styles.chevronContainer}>
				<Icon
					name="chevron-right"
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
		height: 100,
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
