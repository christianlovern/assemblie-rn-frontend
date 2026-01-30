import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppHeader from './AppHeader';
import Drawer from './Drawer';
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
import ChangePasswordScreen from '../screens/menu/ChangePasswordScreen';
import ReportIssueScreen from '../screens/menu/ReportIssueScreen';
import MySchedulesScreen from '../screens/scheduling/MySchedulesScreen';
import UnavailableDatesScreen from '../screens/scheduling/UnavailableDatesScreen';
import SwapRequestsScreen from '../screens/scheduling/SwapRequestsScreen';
import Background from '../../shared/components/Background';

const Stack = createNativeStackNavigator();

const MainAppWrapper = () => {
	const [drawerVisible, setDrawerVisible] = useState(false);

	return (
		<Background>
			<View style={styles.container}>
				<AppHeader onMenuPress={() => setDrawerVisible(true)} />
				<View style={styles.content}>
					<Stack.Navigator
						initialRouteName="Home"
						screenOptions={{
							headerShown: false,
							contentStyle: { backgroundColor: 'transparent' },
						}}>
						<Stack.Screen name="Home" component={HomeScreen} />
						<Stack.Screen name="Profile" component={ProfileScreen} />
						<Stack.Screen name="Teams" component={TeamsScreen} />
						<Stack.Screen
							name="PlanView"
							component={PlanViewScreen}
							options={{
								headerShown: false,
								headerBackVisible: false,
								unmountOnBlur: true,
							}}
						/>
						<Stack.Screen
							name="FileView"
							component={FileViewScreen}
							options={{
								headerShown: true,
								unmountOnBlur: true,
							}}
						/>
						<Stack.Screen name="Media" component={MediaScreen} />
						<Stack.Screen name="Settings" component={SettingsScreen} />
						<Stack.Screen name="Events" component={EventsScreen} />
						<Stack.Screen name="Give" component={GiveScreen} />
						<Stack.Screen name="Contact" component={ContactScreen} />
						<Stack.Screen name="Help" component={HelpScreen} />
						<Stack.Screen name="CheckIn" component={CheckInScreen} />
						<Stack.Screen
							name="ChangePassword"
							component={ChangePasswordScreen}
						/>
					<Stack.Screen
						name="ReportIssue"
						component={ReportIssueScreen}
					/>
					<Stack.Screen
						name="MySchedules"
						component={MySchedulesScreen}
					/>
					<Stack.Screen
						name="UnavailableDates"
						component={UnavailableDatesScreen}
					/>
					<Stack.Screen
						name="SwapRequests"
						component={SwapRequestsScreen}
					/>
				</Stack.Navigator>
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
});

export default MainAppWrapper;

