import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthMain from '../screens/auth/AuthMain.js';
import SignAuth from '../screens/auth/SignAuth.js';
import globalStyles from '../../shared/styles/globalStyles.js';
import PinAuth from '../screens/auth/PinAuth.js';
import SignUp from '../screens/auth/SignUp.js';
import OrganizationSwitcher from '../screens/OrganizationSwitcher.js';
import ForgotPassword from '../screens/auth/ForgotPassword.js';
import VerifyCode from '../screens/auth/VerifyCode.js';
import ResetPassword from '../screens/auth/ResetPassword.js';
import { useTheme } from '../../contexts/ThemeContext';
const Stack = createNativeStackNavigator();

function AuthStack() {
	const { colors } = useTheme();
	return (
		<Stack.Navigator
			initialRouteName={'AuthMain'}
			screenOptions={{
				headerShown: false,
			}}>
			<Stack.Screen
				name='AuthMain'
				component={AuthMain}
				options={{
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: false,
					headerTintColor: colors.accentText,
				}}
			/>
			<Stack.Screen
				name='SignAuth'
				component={SignAuth}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name='PinAuth'
				component={PinAuth}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name='SignUp'
				component={SignUp}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name='OrganizationSwitcher'
				component={OrganizationSwitcher}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: false,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='ForgotPassword'
				component={ForgotPassword}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: false,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='VerifyCode'
				component={VerifyCode}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: false,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='ResetPassword'
				component={ResetPassword}
				options={{
					headerTintColor: colors.accentText,
					headerTransparent: true,
					headerTitle: '',
					headerBackTitleVisible: false,
					headerBackVisible: false,
					headerShown: false,
				}}
			/>
		</Stack.Navigator>
	);
}

export default AuthStack;
