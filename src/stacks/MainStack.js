import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainAppWrapper from '../components/MainAppWrapper';
import OrganizationSwitcher from '../screens/OrganizationSwitcher';

const Stack = createNativeStackNavigator();

function MainStack() {
	console.log(
		'-=-=-=-=-=-=-=-==-=-=-=-==-=-MainStack-=-=-=-=-=-=-=-==-=-=-=-==-=-'
	);
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
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='MainApp'
				component={MainAppWrapper}
				options={{
					headerShown: false,
				}}
			/>
		</Stack.Navigator>
	);
}

export default MainStack;
