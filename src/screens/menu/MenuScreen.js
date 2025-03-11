import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	Dimensions,
	TouchableOpacity,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import Square from './Square';
import Button from '../../../shared/buttons/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
					alignItems: 'center',
					justifyContent: 'space-between',
					marginRight: '10%',
				}}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<Image
						source={{ uri: user.userPhoto }}
						style={styles.userIcon}
					/>
					<View style={{ justifyContent: 'center' }}>
						<Text
							style={
								styles.headerText
							}>{`${user.firstName} - ${user.lastName}`}</Text>
						<Text style={styles.subHeaderText}>
							{organization.name}
						</Text>
					</View>
				</View>
				<TouchableOpacity
					onPress={() => {
						setUser({});
						setAuth(false);
					}}
					style={styles.signOutButton}>
					<Icon
						name='logout'
						size={24}
						color='white'
					/>
				</TouchableOpacity>
			</View>
			<View style={styles.container}>
				<Square type='profile' />
				<Square type='events' />
				<Square type='contactUs' />
				<Square type='media' />
				<Square type='give' />
				<Square type='settings' />
			</View>
			<View
				style={{
					flexDirection: 'row',
					width: '90%',
					justifyContent: 'space-between',
					alignSelf: 'center',
					marginHorizontal: 10,
				}}>
				<View style={{ flex: 1, marginHorizontal: 5 }}>
					<Button
						type='primary'
						text='Check In'
						primaryColor={organization.primaryColor}
						onPress={() => navigation.navigate('CheckIn')}
					/>
				</View>
				<View style={{ flex: 1, marginHorizontal: 5 }}>
					<Button
						type='secondary'
						text='Switch'
						secondaryColor={organization.secondaryColor}
						onPress={() =>
							navigation.navigate('OrganizationSwitcher')
						}
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
		resizeMode: 'cover',
		marginRight: 10,
		borderRadius: 50,
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
	signOutButton: {
		padding: 8,
	},
});

export default MenuScreen;
