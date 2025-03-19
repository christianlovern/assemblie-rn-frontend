import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text } from 'react-native';
import { UserProvider, useData } from './context';
import App from './App';
import globalStyles, { updateGlobalStyles } from './shared/styles/globalStyles';
import { ThemeProvider } from './contexts/ThemeContext';

function AppContext() {
	console.log('AppContext starting to render');

	// Add error boundary
	try {
		return (
			<View style={{ flex: 1 }}>
				<SafeAreaProvider style={globalStyles.topSafeArea}>
					<StatusBar barStyle='dark-content' />
					<UserProvider>
						<ThemeProvider>
							<App />
						</ThemeProvider>
					</UserProvider>
				</SafeAreaProvider>
			</View>
		);
	} catch (error) {
		console.error('Error in AppContext:', error);
		// Show error state instead of white screen
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				}}>
				<Text>Something went wrong. Please restart the app.</Text>
			</View>
		);
	}
}

export default AppContext;
