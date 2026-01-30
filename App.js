/**
 * The purpose of this component is to handle the rendering of the rest of the application.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import * as Linking from 'expo-linking'; 
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
import { useTheme } from './contexts/ThemeContext';
import { handleNotificationTap } from './src/utils/notificationHandler';

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
    const { auth, orgData, setPendingOrg } = useData();
    const { colors } = useTheme();
    const notificationListener = useRef();
    const responseListener = useRef();
    const navigationRef = useRef();

    // 1. Memoize the linking configuration. 
    // This is the most likely fix for the TestFlight hang.
    const linking = useMemo(() => ({
			prefixes: [Linking.createURL('/'), 'https://www.assemblie.app', 'assemblie://'],
	        config: {
            screens: {
                Connect: 'connect', 
            },
        },
        subscribe(listener) {
            const onReceiveURL = ({ url }) => {
                const { queryParams } = Linking.parse(url);
                if (queryParams?.orgId || queryParams?.orgPin) {
                    console.log('Deep Link detected:', queryParams);
                    setPendingOrg({
                        id: queryParams.orgId, 
                        orgPin: queryParams.orgPin
                    });
                }
                listener(url);
            };

            const subscription = Linking.addEventListener('url', onReceiveURL);
            return () => subscription.remove();
        },
    }), [setPendingOrg]); // Only re-create if setPendingOrg changes (which it won't)

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

    useEffect(() => {
        // Log basic state to help debug if you use a remote logger later
        console.log('App Rendering | Auth:', auth, '| Org:', !!orgData);
    }, [auth, orgData]);

    useEffect(() => {
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log('Notification received (foreground):', notification);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    if (auth && navigationRef.current) {
                        handleNotificationTap(response.notification, navigationRef.current);
                    }
                }
            );

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response && auth && navigationRef.current) {
                setTimeout(() => {
                    handleNotificationTap(response.notification, navigationRef.current);
                }, 500);
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, [auth]);

    if (!fontsLoaded) {
        return (
            <SafeAreaProvider>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background || '#10192b' }}>
                    <ActivityIndicator size='large' color={colors.primary} />
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar
                translucent={true}
                backgroundColor={auth ? colors.primary : 'transparent'}
                barStyle='light-content'
            />
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingTop: Platform.OS === 'ios' ? 47 : StatusBar.currentHeight,
                }}>
                <AudioProvider>
                    <NavigationContainer 
                        ref={navigationRef}
                        linking={linking}
                        // Use a fallback to prevent the screen from being blank during link resolution
                        fallback={<ActivityIndicator size="large" color="#fff" />}
                        key={auth ? 'main' : 'auth'}>
                        {auth ? <MainStack /> : <AuthStack />}
                        <MiniPlayer />
                    </NavigationContainer>
                </AudioProvider>
            </View>
        </SafeAreaProvider>
    );
}

export default App;