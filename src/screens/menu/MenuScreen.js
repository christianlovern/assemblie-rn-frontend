import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import Square from './Square';
import Button from '../../../shared/buttons/Button';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

const MenuScreen = ({ navigation }) => {
	const { user, setUser, setAuth, organization } = useData();
	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View
				style={{
					marginLeft: '10%',
					marginTop: '15%',
					flexDirection: 'row',
				}}>
				<Image
					source={require('../../../assets/dummy-org-logo.jpg')}
					style={styles.userIcon}
				/>
				<View
					style={{ justifyContent: 'center', alignItems: 'center' }}>
					<Text
						style={
							styles.headerText
						}>{`${user.firstName} - ${user.lastName}`}</Text>
					<Text style={styles.subHeaderText}>
						{organization.name}
					</Text>
				</View>
			</View>
			<View style={styles.container}>
				<Square type='profile' />
				<Square type='events' />
				<Square type='contactUs' />
				<Square type='announcements' />
				<Square type='give' />
				<Square type='settings' />
			</View>
			<View
				style={{
					flexDirection: 'row',
					width: '85%',
					justifyContent: 'space-evenly',
					alignSelf: 'center',
				}}>
				<View style={{}}>
					<Button
						type='primary'
						text='Check In'
						primaryColor={organization.primaryColor}
						onPress={() => navigation.navigate('CheckIn')}
					/>
				</View>
				<View style={{}}>
					<Button
						type='secondary'
						text='Sign Out'
						secondaryColor={organization.secondaryColor}
						onPress={() => {
							setUser({});
							setAuth(false);
						}}
					/>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row', // Arrange squares in a row
		flexWrap: 'wrap', // Allow wrapping to the next line
		justifyContent: 'center', // Center the squares horizontally
		alignItems: 'center', // Center the squares vertically
		marginTop: '10%',
	},
	headerContainer: {
		height: screenHeight / 3,
		width: screenWidth,
		justifyContent: 'flex-end',
		paddingHorizontal: 15,
		paddingBottom: 10,
	},
	headerText: {
		fontSize: 22,
		color: 'white',
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
	},
	subHeaderText: {
		fontSize: 18,
		color: 'white',
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
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
	userIcon: {
		width: 75,
		height: 75,
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

export default MenuScreen;
