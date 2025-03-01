/**
 * The purpose of this component is to handle the rendering of the rest of the application.
 */

import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/stacks/AuthStack';
import globalStyles from './shared/styles/globalStyles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useData } from './context';
import MainStack from './src/stacks/MainStack';

const Stack = createNativeStackNavigator();

function App() {
	const { auth } = useData();

	if (auth) {
		return (
			<NavigationContainer>
				<MainStack />
			</NavigationContainer>
		);
	} else {
		return (
			<NavigationContainer>
				<Stack.Navigator
					initialRouteName='AuthStack'
					screenOptions={{
						headerShown: false,
					}}>
					{/* Login Screens  */}
					<Stack.Screen
						name='AuthStack'
						component={AuthStack}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		);
	}
}

export default App;
