import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const MediaCard = ({ media, onPress, primaryColor }) => {
	const { colors, colorMode } = useTheme();

	const getFileTypeIcon = (fileType) => {
		const type = fileType?.toLowerCase() || '';
		if (type.match(/^(jpg|jpeg|png|gif|image\/jpeg|image\/png|image\/gif)$/)) {
			return 'image';
		}
		if (type.match(/^(mp4|mov|video\/mp4|video\/quicktime)$/)) {
			return 'videocam';
		}
		if (type.match(/^(mp3|wav|m4a|audio\/mpeg|audio\/mp3|audio\/wav|audio\/m4a)$/)) {
			return 'audiotrack';
		}
		return 'insert-drive-file';
	};

	const isImage = (fileType) => {
		const type = fileType?.toLowerCase() || '';
		return type.match(/^(jpg|jpeg|png|gif|image\/jpeg|image\/png|image\/gif)$/);
	};

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
				{/* Thumbnail or Icon */}
				{isImage(media.fileType) && media.fileUrl ? (
					<Image
						source={{ uri: media.fileUrl }}
						style={styles.thumbnail}
						resizeMode="cover"
					/>
				) : (
					<View style={styles.iconContainer}>
						<Icon
							name={getFileTypeIcon(media.fileType)}
							size={32}
							color={primaryColor}
						/>
					</View>
				)}
				
				{/* Title */}
				<Text
					style={[styles.title, { color: textColor }]}
					numberOfLines={2}>
					{media.name}
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
		flexDirection: 'row',
		alignItems: 'center',
	},
	thumbnail: {
		width: 60,
		height: 60,
		borderRadius: 8,
		marginRight: 12,
		backgroundColor: 'rgba(0, 0, 0, 0.1)',
	},
	iconContainer: {
		width: 60,
		height: 60,
		borderRadius: 8,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	title: {
		...typography.h3,
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	chevronContainer: {
		justifyContent: 'center',
		paddingRight: 16,
	},
});

export default MediaCard;
