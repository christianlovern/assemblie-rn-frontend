import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ImageBackground,
	StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { lightenColor } from '../helper/colorFixer';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const AnnouncementCard = ({
	announcement,
	onPress,
	primaryColor,
	secondaryColor,
	variant = 'list',
}) => {
	const { colors } = useTheme();

	const truncatedDescription =
		announcement.description.length > 200
			? announcement.description.substring(0, 197) + '...'
			: announcement.description;

	const truncatedLocation =
		announcement.location && announcement.location.length > 25
			? announcement.location.substring(0, 22) + '...'
			: announcement.location;

	const CardContent = () => (
		<View style={styles.contentContainer}>
			<View style={styles.header}>
				<View style={styles.iconContainer}>
					{variant === 'list' && (
						<>
							<Icon
								name='campaign'
								size={24}
								color='white'
							/>
							<Text style={[styles.type, { color: 'white' }]}>
								Announcement
							</Text>
						</>
					)}
				</View>
			</View>
			<Text
				style={[styles.title, { color: 'white' }]}
				numberOfLines={variant === 'carousel' ? 1 : 2}>
				{announcement.name}
			</Text>
			<Text
				style={[
					styles.description,
					{ color: 'rgba(255, 255, 255, 0.9)' },
				]}
				numberOfLines={variant === 'carousel' ? 2 : 3}>
				{truncatedDescription}
			</Text>
			<View style={styles.footer}>
				{announcement.location && (
					<View style={styles.locationContainer}>
						<Icon
							name='location-pin'
							size={20}
							color='white'
						/>
						<Text
							style={[styles.location, { color: 'white' }]}
							numberOfLines={1}>
							{truncatedLocation}
						</Text>
					</View>
				)}
				<TouchableOpacity
					style={[
						styles.button,
						{ backgroundColor: 'rgba(255, 255, 255, 0.2)' },
						!announcement.location && styles.buttonFullWidth,
					]}
					onPress={onPress}>
					<Text style={styles.buttonText}>Details</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<TouchableOpacity
			style={[
				styles.cardContainer,
				variant === 'carousel' && styles.carouselCard,
			]}
			onPress={onPress}
			activeOpacity={1}>
			{announcement.image ? (
				<ImageBackground
					source={{ uri: announcement.image }}
					style={styles.card}
					imageStyle={{ borderRadius: 10 }}>
					<View style={[styles.overlay]}>
						<CardContent />
					</View>
				</ImageBackground>
			) : (
				<View
					style={[
						styles.card,
						{
							backgroundColor: lightenColor(
								secondaryColor,
								25,
								0.5
							),
						},
					]}>
					<CardContent />
				</View>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	cardContainer: {
		marginBottom: 10,
		borderRadius: 10,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	carouselCard: {
		height: 280,
	},
	card: {
		borderRadius: 10,
		overflow: 'hidden',
		minHeight: 280,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 10,
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'center',
		padding: 15,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	iconContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	type: {
		...typography.bodyMedium,
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '500',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
		...typography.h2,
	},
	description: {
		fontSize: 16,
		lineHeight: 20,
		marginVertical: 15,
		flex: 0,
		...typography.body,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 15,
		paddingTop: 0,
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		marginRight: 10,
	},
	location: {
		...typography.bodyMedium,
		marginLeft: 5,
		fontSize: 14,
		fontWeight: '500',
	},
	button: {
		width: '33%',
		paddingVertical: 8,
		borderRadius: 5,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	buttonFullWidth: {
		marginLeft: 'auto',
		width: '33%',
	},
	buttonText: {
		...typography.button,
		color: 'white',
		fontSize: 14,
		fontWeight: '500',
		textAlign: 'center',
	},
});

export default AnnouncementCard;
