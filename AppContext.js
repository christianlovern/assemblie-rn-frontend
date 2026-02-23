import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text, LogBox } from 'react-native';
import { UserProvider, useData } from './context';
import App from './App';
import globalStyles, { updateGlobalStyles } from './shared/styles/globalStyles';
import { ThemeProvider } from './contexts/ThemeContext';

// Add Error Boundary Component
class ErrorBoundary extends React.Component {
	state = { hasError: false, error: null };

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.log('App Error:', error);
		console.log('Error Info:', errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<Text>Something went wrong!</Text>
					<Text>{this.state.error?.toString()}</Text>
				</View>
			);
		}
		return this.props.children;
	}
}

function AppContext() {
	console.log('AppContext starting to render');

	// Keep native splash visible until app is ready (avoids black screen on TestFlight/production)
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const SplashScreen = require('expo-splash-screen').default;
				if (!cancelled) await SplashScreen.preventAutoHideAsync();
			} catch (_) {
				// expo-splash-screen not installed; install with: npx expo install expo-splash-screen
			}
		})();
		return () => { cancelled = true; };
	}, []);

	// Add startup logging
	useEffect(() => {
		console.log(
			'App starting in mode:',
			__DEV__ ? 'development' : 'production'
		);

		// Enable LogBox in production temporarily
		if (!__DEV__) {
			LogBox.ignoreLogs([]);
			LogBox.install();
		}
	}, []);

	return (
		<ErrorBoundary>
			<View style={{ flex: 1, backgroundColor: '#fff' }}>
				<SafeAreaProvider style={globalStyles.topSafeArea}>
					<StatusBar
						translucent={true}
						backgroundColor='transparent'
						barStyle='light-content'
					/>
					<UserProvider>
						<ThemeProvider>
							<App />
						</ThemeProvider>
					</UserProvider>
				</SafeAreaProvider>
			</View>
		</ErrorBoundary>
	);
}

export default AppContext;
