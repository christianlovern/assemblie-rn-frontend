import React from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View } from 'react-native';
import { UserProvider } from './context';
import App from './App';
import globalStyles from './shared/styles/globalStyles';

function AppContext() {
	return (
		<View style={{ flex: 1 }}>
			<SafeAreaProvider style={globalStyles.topSafeArea}>
				<StatusBar barStyle='dark-content' />
				<UserProvider>
					<App />
				</UserProvider>
			</SafeAreaProvider>
		</View>
	);
}

export default AppContext;
