import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator.js';
import OrganizationSwitcher from '../screens/OrganizationSwitcher';

const Stack = createNativeStackNavigator();

function MainStack() {
	return (
		<Stack.Navigator
			initialRouteName={'OrganizationSwitcher'}
			screenOptions={{
				headerShown: false,
				headerBackTitleVisible: false,
				headerTitleAlign: 'center',
			}}>
			<Stack.Screen
				name='OrganizationSwitcher'
				component={OrganizationSwitcher}
				options={{
					headerShown: true,
					title: 'Select Organization',
				}}
			/>
			<Stack.Screen
				name='BottomTabs'
				component={BottomTabNavigator}
				options={{
					headerShown: false,
				}}
			/>
		</Stack.Navigator>
	);
}

export default MainStack;
