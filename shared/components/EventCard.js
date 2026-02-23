import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { formatEventDateTimeRangeUTC } from '../helper/normalizers';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../context';
import { typography } from '../styles/typography';

const EventCard = ({ event, onPress, primaryColor }) => {
	const { colorMode } = useTheme();
	const { user, familyMembers } = useData();

	// Same RSVP list resolution as EventDetailDrawer
	const getRsvpList = () => {
		const raw = event?.rsvpUsers ?? event?.rsvps ?? event?.eventRsvps ?? [];
		return Array.isArray(raw) ? raw : [];
	};
	const idMatches = (a, b) =>
		a != null && b != null && (a === b || String(a) === String(b));
	const resolveRsvpToDisplay = (rsvp) => {
		if (rsvp.userId != null && idMatches(rsvp.userId, user?.id)) {
			return {
				key: `user-${rsvp.id ?? rsvp.userId}`,
				uri: user.userPhoto,
				name: [user.firstName, user.lastName].filter(Boolean).join(' '),
			};
		}
		if (rsvp.familyMemberId != null) {
			const member = familyMembers?.activeConnections?.find((c) =>
				idMatches(c.id, rsvp.familyMemberId),
			);
			if (member) {
				return {
					key: `member-${rsvp.id ?? rsvp.familyMemberId}`,
					uri: member.userPhoto,
					name: [member.firstName, member.lastName]
						.filter(Boolean)
						.join(' '),
				};
			}
		}
		return {
			key: `rsvp-${rsvp.id} ${rsvp.firstName} ${rsvp.lastName}`,
			uri: rsvp.userPhoto ?? rsvp.user?.userPhoto,
			name:
				[rsvp.firstName, rsvp.lastName].filter(Boolean).join(' ') ||
				'Guest',
		};
	};
	const rsvpList = getRsvpList();
	const rsvpDisplayList = rsvpList
		.map(resolveRsvpToDisplay)
		.filter((d) => d.name || d.uri);
	const showRsvpAvatars = !user?.isGuest && rsvpDisplayList.length > 0;
	const firstRsvpAvatars = rsvpDisplayList.slice(0, 5);
	const rsvpRemainingCount = Math.max(0, rsvpDisplayList.length - 5);

	const truncatedDescription =
		event.description && event.description.length > 150
			? event.description.substring(0, 147) + '...'
			: event.description || '';

	const textColor = colorMode === 'dark' ? '#FFFFFF' : '#000000';
	const backgroundColor =
		colorMode === 'dark'
			? 'rgba(255, 255, 255, 0.1)'
			: 'rgba(255, 255, 255, 0.9)';

	// Format event time using stored values (no timezone conversion) so displayed time matches what was set
	const formatScheduledTime = () => {
		const targetDate = event.eventDate || event.startDate;
		if (!targetDate) return 'Time TBD';
		return formatEventDateTimeRangeUTC(targetDate, event.eventEndDate);
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

				{showRsvpAvatars && (
					<View style={styles.rsvpPhotosContainer}>
						{firstRsvpAvatars.map((item, index) => (
							<Image
								key={item.key}
								source={
									item.uri
										? { uri: item.uri }
										: require('../../assets/Assemblie_DefaultUserIcon.png')
								}
								style={[
									styles.rsvpPhoto,
									{ marginLeft: index > 0 ? -8 : 0 },
									{ borderColor: backgroundColor },
								]}
							/>
						))}
						{rsvpRemainingCount > 0 && (
							<View
								style={[
									styles.rsvpRemainingCount,
									{ marginLeft: -8, backgroundColor },
								]}>
								<Text
									style={[
										styles.rsvpRemainingCountText,
										{ color: textColor },
									]}>
									+{rsvpRemainingCount}
								</Text>
							</View>
						)}
					</View>
				)}
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
	rsvpPhotosContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	rsvpPhoto: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
	},
	rsvpRemainingCount: {
		width: 24,
		height: 24,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	rsvpRemainingCountText: {
		fontSize: 10,
		fontWeight: '600',
	},
});

export default EventCard;
