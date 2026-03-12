import { registerRootComponent } from 'expo';

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AppContext from './AppContext';

// Defer TrackPlayer registration (iOS only; Android uses expo-av to avoid CAPABILITY_PLAY crash)
if (Constants.appOwnership !== 'expo' && Platform.OS !== 'android') {
	const register = () => {
		try {
			const TrackPlayer = require('react-native-track-player').default;
			if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
				const { PlaybackService } = require('./src/services/playbackService');
				TrackPlayer.registerPlaybackService(() => PlaybackService);
			}
		} catch (_) {}
	};
	if (typeof setImmediate !== 'undefined') {
		setImmediate(register);
	} else {
		setTimeout(register, 0);
	}
}

registerRootComponent(AppContext);
