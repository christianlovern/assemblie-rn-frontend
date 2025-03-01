import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialCommunityIcons as CommunityIcon } from 'react-native-vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { useData } from '../../../context';
import { adjustColor } from '../../../shared/helper/colorFixer';

const Square = ({ type }) => {
	const navigation = useNavigation(); // Initialize navigation
	const { organization } = useData();

	const getSquareData = (type) => {
		switch (type) {
			case 'announcement':
				return {
					icon: 'bullhorn-variant',
					title: 'Announcements',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: 'Events', // Replace with your actual screen name
				};
			case 'profile':
				return {
					icon: 'account',
					title: 'Profile',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: 'Profile', // Replace with your screen name
				};
			case 'settings':
				return {
					icon: 'cog',
					title: 'Settings',
					color: organization.primaryColor,
					borderColor: organization.secondaryColor,
					destination: 'Settings', // Replace with your screen name
				};
			case 'events':
				return {
					icon: 'calendar-month',
					title: 'Events',
					color: organization.primaryColor,
					borderColor: organization.secondaryColor,
					destination: 'Events',
				};
			case 'give':
				return {
					icon: 'hands-pray',
					title: 'Give',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: 'Give', // Replace with your actual screen name
				};
			case 'contactUs':
				return {
					icon: 'email',
					title: 'Contact Us',
					color: organization.primaryColor,
					borderColor: organization.secondaryColor,
					destination: 'Contact', // Replace with your actual screen name
				};
			default:
				return {
					icon: 'help-circle',
					title: 'Unknown',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: null, // Or a default screen
				};
		}
	};

	const { icon, title, color, destination, borderColor } =
		getSquareData(type);

	const handlePress = () => {
		if (destination) {
			navigation.navigate(destination);
		} else {
			console.warn(`No destination defined for type: ${type}`);
		}
	};

	return (
		<TouchableOpacity
			style={[
				styles.square,
				{ backgroundColor: color, borderColor: borderColor },
			]}
			onPress={handlePress}>
			<View style={styles.iconContainer}>
				<CommunityIcon
					name={icon}
					size={40}
					color='white'
				/>
			</View>
			<Text style={styles.title}>{title}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	square: {
		width: 150, // Adjust size as needed
		height: 150, // Adjust size as needed
		borderRadius: 20,
		borderWidth: 2,
		margin: 10, // Adjust margin as needed
		justifyContent: 'center', // Center content vertically
		alignItems: 'center', // Center content horizontally
	},
	iconContainer: {
		marginBottom: 10, // Space between icon and title
	},
	title: {
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center', // Center the title text
	},
});

export default Square;
