import React from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Square from './Square';
import Button from '../../../shared/buttons/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { typography } from '../../../shared/styles/typography';

const MenuScreen = ({ navigation }) => {
	const { user, setUser, setAuth, organization, teams } = useData();
	const { updateTheme, colors } = useTheme();

	const handleSignOut = () => {
		setUser({});
		setAuth(false);
		updateTheme(null);
	};

	return (
		<Background
			primaryColor={colors.primary}
			secondaryColor={colors.secondary}>
			<TouchableOpacity
				onPress={handleSignOut}
				style={[
					styles.signOutButton,
					{ backgroundColor: colors.primary },
				]}>
				<Icon
					name='logout'
					size={24}
					color='white'
				/>
			</TouchableOpacity>
			<ScrollView
				scrollEnabled={teams && teams.length > 0}
				contentContainerStyle={styles.container}
				showsVerticalScrollIndicator={false}>
				<View style={styles.userHeader}>
					<View style={styles.userInfoContainer}>
						<Image
							source={{ uri: user.userPhoto }}
							style={styles.userIcon}
						/>
						<View style={styles.userTextContainer}>
							<Text style={styles.headerText}>
								{`${user.firstName} - ${user.lastName}`}
							</Text>
							<Text style={styles.subHeaderText}>
								{organization.name}
							</Text>
						</View>
					</View>
				</View>
				<View style={styles.squaresContainer}>
					<Square type='profile' />
					<Square type='events' />
					<Square type='contactUs' />
					<Square type='media' />
					<Square type='give' />
					{teams && teams.length > 0 && (
						<Square
							type='teams'
							onPress={() => navigation.navigate('Teams')}
						/>
					)}
					<Square type='settings' />
				</View>
				<View style={styles.bottomButtonContainer}>
					<View style={styles.buttonWrapper}>
						<Button
							type='primary'
							text='Check In'
							primaryColor={colors.primary}
							onPress={() => navigation.navigate('CheckIn')}
						/>
					</View>
					<View style={styles.buttonWrapper}>
						<Button
							type='secondary'
							text='Switch'
							secondaryColor={colors.secondary}
							onPress={() =>
								navigation.navigate('OrganizationSwitcher')
							}
						/>
					</View>
				</View>
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 20,
	},
	title: {
		...typography.h1,
		color: 'white',
		marginBottom: 20,
	},
	userHeader: {
		marginLeft: '10%',
		marginTop: '5%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginRight: '10%',
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	userTextContainer: {
		justifyContent: 'center',
	},
	userIcon: {
		width: 75,
		height: 75,
		resizeMode: 'cover',
		marginRight: 10,
		borderRadius: 50,
	},
	headerText: {
		color: 'white',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
		...typography.h3,
	},
	subHeaderText: {
		color: 'white',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
		...typography.bodyMedium,
	},
	signOutButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		padding: 8,
		borderRadius: 8,
		zIndex: 999,
		elevation: 5,
		minWidth: 40,
		minHeight: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	squaresContainer: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: '10%',
	},
	bottomButtonContainer: {
		flexDirection: 'row',
		width: '90%',
		justifyContent: 'space-between',
		alignSelf: 'center',
		marginHorizontal: 10,
		marginTop: '5%',
	},
	buttonWrapper: {
		flex: 1,
		marginHorizontal: 5,
	},
});

export default MenuScreen;
