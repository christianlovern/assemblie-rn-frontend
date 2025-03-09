import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/home/Homescreen';
import MenuScreen from '../screens/menu/MenuScreen';
import ProfileScreen from '../screens/menu/ProfileScreen';
import SettingsScreen from '../screens/menu/SettingsScreen';
import EventsScreen from '../screens/menu/EventsScreen';
import HelpScreen from '../screens/menu/HelpScreen';
import ContactScreen from '../screens/menu/ContactScreen';
import GiveScreen from '../screens/menu/GiveScreen';
import CheckInScreen from '../screens/menu/CheckInScreen';
import { useData } from '../../context';
import { lightenColor } from '../../shared/helper/colorFixer';
import MediaScreen from '../screens/media/MediaScreen';
import FileViewScreen from '../screens/media/FileViewScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
	const { organization } = useData();
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

					if (!['Home', 'Menu'].includes(route.name)) {
						return null;
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
					organization.secondaryColor
				),
				tabBarInactiveTintColor: lightenColor(
					organization.primaryColor
				),
				tabBarStyle: {
					borderTopColor: 'transparent',
					backgroundColor: organization.primaryColor,
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
				component={MenuScreen}
				options={{
					headerShown: false,
				}}
			/>
			<Tab.Screen
				name='Profile'
				component={ProfileScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='Media'
				component={MediaScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='FileView'
				component={FileViewScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='Settings'
				component={SettingsScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='Events'
				component={EventsScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='Give'
				component={GiveScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='Contact'
				component={ContactScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='Help'
				component={HelpScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
			<Tab.Screen
				name='CheckIn'
				component={CheckInScreen}
				options={{
					headerShown: false,
					tabBarButton: () => null,
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;
