import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useData } from '../../context.js';
import BottomTabNavigator from './BottomTabNavigator.js';

const Stack = createNativeStackNavigator();

function MainStack() {
	return (
		<Stack.Navigator
			initialRouteName={'BottomTabs'}
			screenOptions={{
				headerShown: false,
				headerBackTitleVisible: false,
				headerTitleAlign: 'center',
			}}>
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
