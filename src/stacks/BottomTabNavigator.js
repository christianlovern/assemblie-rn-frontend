import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import HomeScreen from '../screens/home/Homescreen';
import MenuScreen from '../screens/menu/MenuScreen';
import ProfileScreen from '../screens/menu/ProfileScreen';
import TeamsScreen from '../screens/teams/TeamsScreen';
import PlanViewScreen from '../screens/plans/PlanViewScreen';
import FileViewScreen from '../screens/media/FileViewScreen';
import MediaScreen from '../screens/media/MediaScreen';
import SettingsScreen from '../screens/menu/SettingsScreen';
import EventsScreen from '../screens/menu/EventsScreen';
import GiveScreen from '../screens/menu/GiveScreen';
import ContactScreen from '../screens/menu/ContactScreen';
import HelpScreen from '../screens/menu/HelpScreen';
import CheckInScreen from '../screens/menu/CheckInScreen';
import { useData } from '../../context';
import { lightenColor } from '../../shared/helper/colorFixer';
import ChangePasswordScreen from '../screens/menu/ChangePasswordScreen';
import ReportIssueScreen from '../screens/menu/ReportIssueScreen';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();

const MenuStackScreen = () => {
	return (
		<MenuStack.Navigator screenOptions={{ headerShown: false }}>
			<MenuStack.Screen
				name='MenuMain'
				component={MenuScreen}
			/>
			<MenuStack.Screen
				name='Profile'
				component={ProfileScreen}
			/>
			<MenuStack.Screen
				name='ChangePassword'
				component={ChangePasswordScreen}
			/>
			<MenuStack.Screen
				name='ReportIssue'
				component={ReportIssueScreen}
			/>
			<MenuStack.Screen
				name='Teams'
				component={TeamsScreen}
			/>
			<MenuStack.Screen
				name='PlanView'
				component={PlanViewScreen}
				options={{
					headerShown: true,
					unmountOnBlur: true,
				}}
			/>
			<MenuStack.Screen
				name='FileView'
				component={FileViewScreen}
				options={{
					headerShown: true,
					unmountOnBlur: true,
				}}
			/>
			<MenuStack.Screen
				name='Media'
				component={MediaScreen}
			/>
			<MenuStack.Screen
				name='Settings'
				component={SettingsScreen}
			/>
			<MenuStack.Screen
				name='Events'
				component={EventsScreen}
			/>
			<MenuStack.Screen
				name='Give'
				component={GiveScreen}
			/>
			<MenuStack.Screen
				name='Contact'
				component={ContactScreen}
			/>
			<MenuStack.Screen
				name='Help'
				component={HelpScreen}
			/>
			<MenuStack.Screen
				name='CheckIn'
				component={CheckInScreen}
			/>
		</MenuStack.Navigator>
	);
};

const BottomTabNavigator = () => {
	const { organization } = useData();

	// Default colors to use when organization data isn't available yet
	const defaultColors = {
		primaryColor: '#000000',
		secondaryColor: '#666666',
	};

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) => {
					let iconName;

					if (route.name === 'Home') {
						iconName = focused
							? 'home-variant'
							: 'home-variant-outline';
					} else if (route.name === 'Menu') {
						iconName = focused ? 'menu' : 'menu';
					}

					return (
						<Icon
							name={iconName}
							size={size}
							color={color}
						/>
					);
				},
				tabBarActiveTintColor: lightenColor(
					organization?.secondaryColor || defaultColors.secondaryColor
				),
				tabBarInactiveTintColor: lightenColor(
					organization?.primaryColor || defaultColors.primaryColor
				),
				tabBarStyle: {
					borderTopColor: 'transparent',
					backgroundColor:
						organization?.primaryColor ||
						defaultColors.primaryColor,
				},
			})}>
			<Tab.Screen
				name='Home'
				component={HomeScreen}
				options={{
					headerShown: false,
				}}
			/>
			<Tab.Screen
				name='Menu'
				component={MenuStackScreen}
				options={{
					headerShown: false,
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;
