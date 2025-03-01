import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { lightenColor } from '../helper/colorFixer';
import { dateNormalizer } from '../helper/normalizers';

const AnnouncementCard = ({
	announcement,
	onPress,
	primaryColor,
	secondaryColor,
	variant = 'list',
}) => {
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
					source={announcement.image}
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
						{ backgroundColor: lightenColor(secondaryColor) },
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
		height: 280, // Fixed height for carousel
	},
	card: {
		borderRadius: 10,
		overflow: 'hidden',
		minHeight: 280,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: 15,
		borderRadius: 10,
	},
	contentContainer: {
		flex: 1,
		padding: 15,
		justifyContent: 'space-between',
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
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '500',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	description: {
		fontSize: 16,
		lineHeight: 20,
		marginBottom: 'auto',
		flex: 1,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 'auto',
		paddingTop: 10,
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		marginRight: 10,
	},
	location: {
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
		color: 'white',
		fontSize: 14,
		fontWeight: '500',
		textAlign: 'center',
	},
});

export default AnnouncementCard;
