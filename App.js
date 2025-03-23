/**
 * The purpose of this component is to handle the rendering of the rest of the application.
 */

import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/stacks/AuthStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useData } from './context';
import MainStack from './src/stacks/MainStack';
import {
	useFonts,
	Montserrat_100Thin,
	Montserrat_200ExtraLight,
	Montserrat_300Light,
	Montserrat_400Regular,
	Montserrat_500Medium,
	Montserrat_600SemiBold,
	Montserrat_700Bold,
	Montserrat_800ExtraBold,
	Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { AudioProvider } from './src/contexts/AudioContext';
import MiniPlayer from './shared/components/MiniPlayer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

// Configure how notifications should be presented when the app is in foreground
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

function App() {
	const { auth, orgData } = useData();
	const notificationListener = useRef();
	const responseListener = useRef();

	let [fontsLoaded] = useFonts({
		Montserrat_100Thin,
		Montserrat_200ExtraLight,
		Montserrat_300Light,
		Montserrat_400Regular,
		Montserrat_500Medium,
		Montserrat_600SemiBold,
		Montserrat_700Bold,
		Montserrat_800ExtraBold,
		Montserrat_900Black,
	});

	// Add useEffect for notification listeners
	useEffect(() => {
		// Handler for when notification is received while app is running
		notificationListener.current =
			Notifications.addNotificationReceivedListener((notification) => {
				console.log('Notification received:', notification);
			});

		// Handler for when user taps on notification
		responseListener.current =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					console.log('Notification tapped:', response);
					// Handle notification tap here
				}
			);

		// Cleanup listeners on unmount
		return () => {
			Notifications.removeNotificationSubscription(
				notificationListener.current
			);
			Notifications.removeNotificationSubscription(
				responseListener.current
			);
		};
	}, []);

	if (!fontsLoaded) {
		return (
			<SafeAreaProvider>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<ActivityIndicator size='large' />
				</View>
			</SafeAreaProvider>
		);
	}

	if (auth) {
		return (
			<SafeAreaProvider>
				<StatusBar barStyle='light-content' />
				<View
					style={{
						flex: 1,
						backgroundColor: orgData?.primaryColor || '#000000',
						paddingTop: Platform.OS === 'ios' ? 47 : 0,
					}}>
					<AudioProvider>
						<NavigationContainer>
							<MainStack />
							<MiniPlayer />
						</NavigationContainer>
					</AudioProvider>
				</View>
			</SafeAreaProvider>
		);
	} else {
		return (
			<SafeAreaProvider>
				<StatusBar barStyle='light-content' />
				<View
					style={{
						flex: 1,
						backgroundColor: '#000000',
						paddingTop: Platform.OS === 'ios' ? 47 : 0,
					}}>
					<AudioProvider>
						<NavigationContainer>
							<Stack.Navigator
								initialRouteName='AuthStack'
								screenOptions={{
									headerShown: false,
								}}>
								<Stack.Screen
									name='AuthStack'
									component={AuthStack}
								/>
							</Stack.Navigator>
							<MiniPlayer />
						</NavigationContainer>
					</AudioProvider>
				</View>
			</SafeAreaProvider>
		);
	}
}

export default App;
