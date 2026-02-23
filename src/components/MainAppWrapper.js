import React, { useState, Suspense, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, AppState } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context';
import AppHeader from './AppHeader';
import Drawer from './Drawer';
import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../utils/notificationUtils';
import HomeScreen from '../screens/home/Homescreen';
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
import ShareMyChurchScreen from '../screens/menu/ShareMyChurchScreen';
import ChangePasswordScreen from '../screens/menu/ChangePasswordScreen';
import ReportIssueScreen from '../screens/menu/ReportIssueScreen';
import MeetTheStaffScreen from '../screens/menu/MeetTheStaffScreen';
import MySchedulesScreen from '../screens/scheduling/MySchedulesScreen';
import UnavailableDatesScreen from '../screens/scheduling/UnavailableDatesScreen';
import SwapRequestsScreen from '../screens/scheduling/SwapRequestsScreen';
import Background from '../../shared/components/Background';

// Lazy-load chat screens so socket.io-client and team chat API load only when user opens chat (avoids production black screen)
const MyChatsScreen = React.lazy(() => import('../screens/chat/MyChatsScreen'));
const TeamChatScreen = React.lazy(
	() => import('../screens/chat/TeamChatScreen'),
);

const Stack = createNativeStackNavigator();

const MainAppWrapper = () => {
	const [drawerVisible, setDrawerVisible] = useState(false);
	const navigation = useNavigation();
	const { user, organization } = useData();
	const hasAttemptedPushRegistration = useRef(false);
	const hasRegisteredPushSuccessfully = useRef(false);

	const tryRegisterPushToken = async () => {
		if (!user?.id || !organization?.id) return;
		try {
			const token = await registerForPushNotificationsAsync();
			if (token) {
				await sendPushTokenToBackend(
					token,
					user.id,
					organization.id,
				);
				hasRegisteredPushSuccessfully.current = true;
			}
		} catch (e) {
			console.warn('Push registration:', e?.message || e);
		}
	};

	// Initial registration when main app loads (iOS and Android). Delay slightly so the
	// system permission dialog is more likely to show on Android.
	useEffect(() => {
		if (!user?.id || !organization?.id) return;
		hasAttemptedPushRegistration.current = true;
		const t = setTimeout(tryRegisterPushToken, 1000);
		return () => clearTimeout(t);
	}, [user?.id, organization?.id]);

	// Retry when app comes to foreground if we attempted but never successfully registered
	// (e.g. user granted permission in system settings while app was backgrounded).
	useEffect(() => {
		const sub = AppState.addEventListener('change', (nextAppState) => {
			if (
				nextAppState !== 'active' ||
				!user?.id ||
				!organization?.id ||
				hasRegisteredPushSuccessfully.current
			) {
				return;
			}
			if (hasAttemptedPushRegistration.current) {
				tryRegisterPushToken();
			}
		});
		return () => sub?.remove();
	}, [user?.id, organization?.id]);

	return (
		<Background>
			<View style={styles.container}>
				<AppHeader
					onMenuPress={() => setDrawerVisible(true)}
					onQRPress={() =>
						navigation.navigate('MainApp', {
							screen: 'ShareMyChurch',
						})
					}
				/>
				<View style={styles.content}>
					<Suspense
						fallback={
							<View style={[styles.container, styles.centered]}>
								<ActivityIndicator
									size='large'
									color='#4b95a3'
								/>
							</View>
						}>
						<Stack.Navigator
							initialRouteName='Home'
							screenOptions={{
								headerShown: false,
								contentStyle: {
									backgroundColor: 'transparent',
								},
							}}>
							<Stack.Screen
								name='Home'
								component={HomeScreen}
							/>
							<Stack.Screen
								name='Profile'
								component={ProfileScreen}
							/>
							<Stack.Screen
								name='Teams'
								component={TeamsScreen}
							/>
							<Stack.Screen
								name='PlanView'
								component={PlanViewScreen}
								options={{
									headerShown: false,
									headerBackVisible: false,
									unmountOnBlur: true,
								}}
							/>
							<Stack.Screen
								name='FileView'
								component={FileViewScreen}
								options={{
									headerShown: true,
									unmountOnBlur: true,
								}}
							/>
							<Stack.Screen
								name='Media'
								component={MediaScreen}
							/>
							<Stack.Screen
								name='Settings'
								component={SettingsScreen}
							/>
							<Stack.Screen
								name='Events'
								component={EventsScreen}
							/>
							<Stack.Screen
								name='Give'
								component={GiveScreen}
							/>
							<Stack.Screen
								name='Contact'
								component={ContactScreen}
							/>
							<Stack.Screen
								name='MeetTheStaff'
								component={MeetTheStaffScreen}
							/>
							<Stack.Screen
								name='Help'
								component={HelpScreen}
							/>
							<Stack.Screen
								name='CheckIn'
								component={CheckInScreen}
							/>
							<Stack.Screen
								name='ShareMyChurch'
								component={ShareMyChurchScreen}
							/>
							<Stack.Screen
								name='ChangePassword'
								component={ChangePasswordScreen}
							/>
							<Stack.Screen
								name='ReportIssue'
								component={ReportIssueScreen}
							/>
							<Stack.Screen
								name='MySchedules'
								component={MySchedulesScreen}
							/>
							<Stack.Screen
								name='UnavailableDates'
								component={UnavailableDatesScreen}
							/>
							<Stack.Screen
								name='SwapRequests'
								component={SwapRequestsScreen}
							/>
							<Stack.Screen
								name='MyChats'
								component={MyChatsScreen}
							/>
							<Stack.Screen
								name='TeamChat'
								component={TeamChatScreen}
							/>
						</Stack.Navigator>
					</Suspense>
				</View>
				<Drawer
					visible={drawerVisible}
					onClose={() => setDrawerVisible(false)}
				/>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	centered: {
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default MainAppWrapper;
