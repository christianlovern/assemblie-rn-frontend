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

const AnnouncementCard = ({
	announcement,
	onPress,
	primaryColor,
}) => {
	const { colors, colorMode } = useTheme();

	const truncatedDescription =
		announcement.description && announcement.description.length > 150
			? announcement.description.substring(0, 147) + '...'
			: announcement.description || '';

	const textColor = colorMode === 'dark' ? '#FFFFFF' : '#000000';
	const backgroundColor = colorMode === 'dark' 
		? 'rgba(255, 255, 255, 0.1)' 
		: 'rgba(255, 255, 255, 0.9)';

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
					{announcement.name}
				</Text>
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
		marginBottom: 8,
	},
	description: {
		...typography.body,
		fontSize: 14,
		lineHeight: 20,
		opacity: 0.8,
	},
});

export default AnnouncementCard;
