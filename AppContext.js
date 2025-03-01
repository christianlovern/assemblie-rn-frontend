import React from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { UserProvider } from './context';
import App from './App';
import globalStyles from './shared/styles/globalStyles';

function AppContext() {
	return (
		<SafeAreaProvider style={globalStyles.topSafeArea}>
			<StatusBar hidden />
			<UserProvider>
				<App />
			</UserProvider>
		</SafeAreaProvider>
	);
}

export default AppContext;
