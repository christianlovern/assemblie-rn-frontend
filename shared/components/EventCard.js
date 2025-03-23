import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ImageBackground,
	StyleSheet,
	Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { lightenColor } from '../helper/colorFixer';
import { dateNormalizer } from '../helper/normalizers';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const EventCard = ({ event, onPress, primaryColor, variant = 'list' }) => {
	const { colors } = useTheme();

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
				<Text
					style={[styles.title, { color: 'white' }]}
					numberOfLines={variant === 'carousel' ? 1 : 2}>
					{event.name}
				</Text>
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
					{event.checkedInUsers &&
						event.checkedInUsers.length > 0 && (
							<View style={styles.checkedInContainer}>
								{event.checkedInUsers
									.slice(0, 3)
									.map((user, index) => (
										<Image
											key={user.id}
											source={{ uri: user.userPhoto }}
											style={[
												styles.checkedInUserImage,
												{
													marginLeft:
														index > 0 ? -10 : 0,
												},
											]}
										/>
									))}
								{event.checkedInUsers.length > 3 && (
									<View style={styles.remainingCount}>
										<Text style={styles.remainingCountText}>
											+{event.checkedInUsers.length - 3}
										</Text>
									</View>
								)}
							</View>
						)}
				</View>
				<Text
					style={[
						styles.description,
						{ color: 'rgba(255, 255, 255, 0.9)' },
					]}
					numberOfLines={variant === 'carousel' ? 2 : 3}>
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
							!event.eventLocation && styles.buttonFullWidth,
						]}
						onPress={onPress}>
						<Text style={styles.buttonText}>Details</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	const styles = StyleSheet.create({
		cardContainer: {
			marginBottom: 10,
			borderRadius: 10,
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
			borderWidth: 2,
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
			justifyContent: 'center',
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
			...typography.bodyMedium,
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
		checkedInContainer: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		checkedInUserImage: {
			width: 24,
			height: 24,
			borderRadius: 12,
			borderWidth: 2,
			borderColor: 'white',
		},
		remainingCount: {
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: 'rgba(255, 255, 255, 0.3)',
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: -10,
		},
		remainingCountText: {
			color: 'white',
			fontSize: 12,
			fontWeight: '600',
		},
	});

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
					source={{ uri: event.image }}
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
							borderColor: primaryColor,
							backgroundColor: lightenColor(
								primaryColor,
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

export default EventCard;
