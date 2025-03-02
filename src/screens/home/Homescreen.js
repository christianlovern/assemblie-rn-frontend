import React, { useState, useEffect } from 'react';
import {
	ScrollView,
	View,
	Text,
	StyleSheet,
	Image,
	ImageBackground,
	Dimensions,
} from 'react-native';
import { Card } from '@rneui/themed';
import globalStyles from '../../../shared/styles/globalStyles';
import { useData } from '../../../context';
import InAppPrimary from '../../../shared/buttons/InAppPrimary';
import Carousel from '../../../shared/components/Carousel';
import { announcements, events } from '../../../dummyData';
import Background from '../../../shared/components/Background';
import Button from '../../../shared/buttons/Button';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { useNavigation } from '@react-navigation/native';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const HomeScreen = () => {
	const { user, setUser, organization } = useData();
	const navigation = useNavigation();
	console.log('USER DATA', user);

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<ScrollView>
				<View
					style={{
						flex: 1,
						height: '100%',
						width: '100%',
						marginBottom: 20,
					}}>
					<ImageBackground
						source={require('../../../assets/dummy-org-cover.jpg')}
						style={styles.headerContainer}
						opacity={0.8}>
						{/* Gradient Overlay */}
						<View style={styles.rowContainer}>
							<Image
								source={require('../../../assets/dummy-org-logo.jpg')}
								style={styles.organizationIcon}
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
						<Carousel
							type={'announcements'}
							cards={announcements}
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
							{'Events'}
						</Text>
						<Carousel
							type={'events'}
							cards={events.map((event) => ({
								...event,
								startDate: new Date(event.startDate),
								endDate: new Date(event.endDate),
							}))}
						/>
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
	headerContainer: {
		height: screenHeight / 3,
		width: screenWidth,
		justifyContent: 'flex-end',
		paddingHorizontal: 15,
		paddingBottom: 10,
	},
	headerText: {
		fontSize: 28,
		fontWeight: 'bold',
		justifyContent: 'center',
		marginLeft: '7.5%',
		marginBottom: 20,
	},
	gradientOverlay: {
		position: 'absolute',
		width: screenWidth,
		height: '100%',
	},
	rowContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	organizationIcon: {
		width: 100,
		height: 100,
		resizeMode: 'contain',
		marginRight: 10,
		borderRadius: 50, // Adjusted to maintain aspect ratio
	},
	organizationName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 10,
	},
	organizationLocation: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 10,
	},
	carouselContainer: {
		height: 350,
		marginTop: 20,
	},
	buttonContainer: {
		width: '85%',
		justifyContent: 'center',
		alignSelf: 'center',
		marginTop: 20,
	},
});

export default HomeScreen;
