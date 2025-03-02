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

const EventCard = ({ event, onPress, primaryColor, variant = 'list' }) => {
	const truncatedDescription =
		event.description.length > 200
			? event.description.substring(0, 147) + '...'
			: event.description;

	const CardContent = () => {
		const truncatedLocation =
			event.eventLocation && event.eventLocation.length > 25
				? event.eventLocation.substring(0, 22) + '...'
				: event.eventLocation;

		return (
			<View style={styles.contentContainer}>
				<View style={styles.header}>
					<View style={styles.iconContainer}>
						<Icon
							name='event'
							size={24}
							color='white'
						/>
						<Text style={[styles.date, { color: 'white' }]}>
							{event.startDate && event.endDate
								? `${dateNormalizer(
										event.startDate
								  )} - ${dateNormalizer(event.endDate)}`
								: event.startDate
								? dateNormalizer(event.startDate)
								: 'Date TBD'}
						</Text>
					</View>
				</View>
				<Text
					style={[
						styles.title,
						{ color: 'white' },
						variant === 'carousel'
							? { numberOfLines: 1 }
							: { numberOfLines: 2 },
					]}>
					{event.name}
				</Text>
				<Text
					style={[
						styles.description,
						{ color: 'rgba(255, 255, 255, 0.9)' },
						variant === 'carousel'
							? { numberOfLines: 2 }
							: { numberOfLines: 3 },
					]}>
					{truncatedDescription}
				</Text>
				<View style={styles.footer}>
					{event.eventLocation && (
						<View style={styles.locationContainer}>
							<Icon
								name='location-pin'
								size={20}
								color='white'
							/>
							<Text
								style={[
									styles.location,
									{ color: 'white' },
									{ numberOfLines: 1 },
								]}>
								{truncatedLocation}
							</Text>
						</View>
					)}
					<TouchableOpacity
						style={[
							styles.button,
							!event.eventLocation && styles.buttonFullWidth,
						]}
						onPress={onPress}>
						<Text style={styles.buttonText}>Details</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	return (
		<TouchableOpacity
			style={[
				styles.cardContainer,
				variant === 'carousel' && styles.carouselCard,
			]}
			onPress={onPress}
			activeOpacity={1}>
			{event.image ? (
				<ImageBackground
					source={event.image}
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
						{ backgroundColor: lightenColor(primaryColor) },
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
	date: {
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

export default EventCard;
