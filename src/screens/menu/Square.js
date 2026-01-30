import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as CommunityIcon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../../context';
import { typography } from '../../../shared/styles/typography';
import { useTheme } from '@react-navigation/native';

const Square = ({ type, onPress }) => {
	const navigation = useNavigation();
	const { organization, colors, user } = useData();

	if (!user || !organization) {
        return null; 
    }
	const { updateTheme } = useTheme();

	const getSquareData = (type) => {
		switch (type) {
			case 'media':
				return {
					icon: 'image',
					title: 'Media',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: 'Media',
				};
			case 'profile':
				return {
					icon: 'account',
					title: 'Profile',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: 'Profile',
				};
			case 'settings':
				return {
					icon: 'cog',
					title: 'Settings',
					color: organization.primaryColor,
					borderColor: organization.secondaryColor,
					destination: 'Settings',
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
					color: user.isGuest
						? organization.primaryColor
						: organization.secondaryColor,
					borderColor: user.isGuest
						? organization.secondaryColor
						: organization.primaryColor,
					destination: 'Give',
				};
			case 'contactUs':
				return {
					icon: 'email',
					title: 'Directory',
					color: user.isGuest
						? organization.secondaryColor
						: organization.primaryColor,
					borderColor: user.isGuest
						? organization.primaryColor
						: organization.secondaryColor,
					destination: 'Contact',
				};
			case 'teams':
				return {
					icon: 'account-group',
					title: 'Teams',
					color: organization.primaryColor,
					borderColor: organization.secondaryColor,
					destination: 'Teams',
				};
			default:
				return {
					icon: 'help-circle',
					title: 'Unknown',
					color: organization.secondaryColor,
					borderColor: organization.primaryColor,
					destination: null,
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
				styles.container,
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
	container: {
		width: 150,
		height: 150,
		borderRadius: 20,
		borderWidth: 2,
		margin: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconContainer: {
		marginBottom: 10,
	},
	title: {
		...typography.h3,
		color: 'white',
		textAlign: 'center',
	},
});

export default Square;
