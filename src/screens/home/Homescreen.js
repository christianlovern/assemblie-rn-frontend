import React, { useEffect } from 'react';
import {
	ScrollView,
	View,
	Text,
	Image,
	ImageBackground,
	StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../../shared/buttons/Button';
import Carousel from '../../../shared/components/Carousel';
import Background from '../../../shared/components/Background';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { typography } from '../../../shared/styles/typography';

const HomeScreen = () => {
	const { user, organization, announcements, events, teams } = useData();
	const navigation = useNavigation();
	const { colors } = useTheme();

	console.log('teams', teams);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Ionicons
					name='swap-horizontal'
					size={24}
					color={organization.primaryColor}
					style={{ marginRight: 15 }}
					onPress={() => navigation.navigate('OrganizationSwitcher')}
				/>
			),
		});
	}, [navigation, organization.primaryColor]);

	// Prepare the data for carousels - fix the data access
	const announcementsData = announcements?.announcements || [];
	const eventsData = events?.events || [];

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<View style={styles.homeContainer}>
					<ImageBackground
						source={
							organization?.coverImage
								? { uri: organization.coverImage }
								: require('../../../assets/dummy-org-cover.jpg')
						}
						style={styles.headerContainer}
						resizeMode='cover'
						opacity={0.8}
						onError={(e) =>
							console.log(
								'Cover Image Error:',
								e.nativeEvent.error
							)
						}>
						{/* Gradient Overlay */}
						<View style={styles.rowContainer}>
							<Image
								source={
									organization?.orgPicture
										? { uri: organization.orgPicture }
										: require('../../../assets/dummy-org-logo.jpg')
								}
								style={styles.organizationIcon}
								resizeMode='cover'
								onError={(e) =>
									console.log(
										'Org Picture Error:',
										e.nativeEvent.error
									)
								}
							/>
							<View>
								<Text style={styles.organizationName}>
									{organization.name}
								</Text>
								<Text style={styles.organizationLocation}>
									{organization.city}, {organization.state}
								</Text>
							</View>
						</View>
					</ImageBackground>
					<View style={styles.buttonContainer}>
						<Button
							type='primary'
							primaryColor={organization.primaryColor}
							text='View Calendar'
							onPress={() => navigation.navigate('Events')}
						/>
					</View>
					<View style={styles.carouselContainer}>
						<Text
							style={[
								styles.headerText,
								{
									color: lightenColor(
										organization.primaryColor
									),
								},
							]}>
							{'Announcements'}
						</Text>
						{announcementsData && announcementsData.length > 0 ? (
							<Carousel
								type={'announcements'}
								cards={announcementsData}
							/>
						) : (
							<Text style={styles.noDataText}>
								No announcements available
							</Text>
						)}
					</View>
					<View style={styles.carouselContainer}>
						<Text
							style={[
								styles.headerText,
								{
									color: lightenColor(
										organization.primaryColor
									),
								},
							]}>
							{'Events'}
						</Text>
						{eventsData && eventsData.length > 0 ? (
							<Carousel
								type={'events'}
								cards={eventsData}
							/>
						) : (
							<Text style={styles.noDataText}>
								No events available
							</Text>
						)}
					</View>
					<View style={styles.buttonContainer}>
						<Button
							type='primary'
							primaryColor={organization.primaryColor}
							text='Check In'
							onPress={() => navigation.navigate('CheckIn')}
						/>
					</View>
				</View>
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
	},
	homeContainer: {
		flex: 1,
		paddingBottom: 20,
	},
	headerContainer: {
		width: '100%',
		height: 200,
		justifyContent: 'flex-end',
		paddingBottom: 20,
	},
	rowContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	organizationIcon: {
		width: 80,
		height: 80,
		borderRadius: 30,
		marginHorizontal: 15,
	},
	organizationName: {
		...typography.h2,
		color: '#FFFFFF',
	},
	organizationLocation: {
		...typography.body,
		color: '#FFFFFF',
	},
	buttonContainer: {
		paddingHorizontal: 20,
		marginVertical: 15,
	},
	carouselContainer: {
		marginVertical: 10,
		height: 350,
	},
	headerText: {
		...typography.h2,
		marginLeft: 20,
		marginBottom: 10,
	},
	noDataText: {
		...typography.body,
		color: '#FFFFFF',
		textAlign: 'center',
		marginTop: 20,
	},
});

export default HomeScreen;
