import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';
import { formatScheduleDate } from '../helper/normalizers';
import StatusBadge from './StatusBadge';

const ScheduleCard = ({ schedule, onPress, onAccept, onDecline, onRequestSwap }) => {
	const { colors, colorMode } = useTheme();

	const textColor = colorMode === 'dark' ? '#FFFFFF' : '#000000';
	const backgroundColor = colorMode === 'dark' 
		? 'rgba(255, 255, 255, 0.1)' 
		: 'rgba(255, 255, 255, 0.9)';

	const canAccept = schedule.status === 'pending';
	const canDecline = schedule.status === 'pending';
	const canRequestSwap = schedule.status === 'approved';

	return (
		<TouchableOpacity
			style={[
				styles.cardContainer,
				{ backgroundColor },
			]}
			onPress={onPress}
			activeOpacity={0.7}>
			{/* Left indicator */}
			<View
				style={[
					styles.leftIndicator,
					{ backgroundColor: colors.primary },
				]}
			/>
			
			{/* Content */}
			<View style={styles.contentContainer}>
				<View style={styles.headerRow}>
					<Text
						style={[styles.date, { color: textColor }]}>
						{formatScheduleDate(schedule.scheduledDate)}
					</Text>
					<StatusBadge status={schedule.status} />
				</View>

				{schedule.plan && (
					<Text
						style={[styles.planTitle, { color: textColor }]}
						numberOfLines={1}>
						{schedule.plan.mainTitle}
					</Text>
				)}

				{schedule.team && (
					<Text
						style={[styles.teamName, { color: textColor }]}
						numberOfLines={1}>
						{schedule.team.name}
					</Text>
				)}

				{schedule.requester && (
					<Text
						style={[styles.requester, { color: textColor }]}
						numberOfLines={1}>
						Requested by: {schedule.requester.firstName} {schedule.requester.lastName}
					</Text>
				)}

				{/* Action Buttons */}
				<View style={styles.actionButtons}>
					{canAccept && (
						<TouchableOpacity
							style={[styles.actionButton, styles.acceptButton]}
							onPress={(e) => {
								e.stopPropagation();
								onAccept && onAccept();
							}}>
							<Text style={styles.actionButtonText}>Accept</Text>
						</TouchableOpacity>
					)}
					{canDecline && (
						<TouchableOpacity
							style={[styles.actionButton, styles.declineButton]}
							onPress={(e) => {
								e.stopPropagation();
								onDecline && onDecline();
							}}>
							<Text style={styles.actionButtonText}>Decline</Text>
						</TouchableOpacity>
					)}
					{canRequestSwap && (
						<TouchableOpacity
							style={[styles.actionButton, styles.swapButton]}
							onPress={(e) => {
								e.stopPropagation();
								onRequestSwap && onRequestSwap();
							}}>
							<Text style={styles.actionButtonText}>Request Swap</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
			
			{/* Chevron */}
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
		minHeight: 120,
	},
	leftIndicator: {
		width: 4,
	},
	contentContainer: {
		flex: 1,
		padding: 16,
		paddingLeft: 26,
	},
	headerRow: {
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
		marginBottom: 8,
	},
	actionButtons: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 8,
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	acceptButton: {
		backgroundColor: '#52c41a',
	},
	declineButton: {
		backgroundColor: '#ff4d4f',
	},
	swapButton: {
		backgroundColor: '#1890ff',
	},
	actionButtonText: {
		...typography.caption,
		fontSize: 12,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	chevronContainer: {
		justifyContent: 'center',
		paddingRight: 16,
	},
});

export default ScheduleCard;
