/**
 * Audio context entry point. Uses TrackPlayer in development builds
 * (background + lock screen) and expo-av in Expo Go (in-app only).
 * On Android dev builds we use expo-av to avoid TrackPlayer native module
 * "CAPABILITY_PLAY of null" until the library is ready.
 */
import React, { useState, useEffect } from 'react';
import { InteractionManager, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AudioContext } from './audioContextBase';

export { useAudio } from './audioContextBase';

const FALLBACK_AUDIO_VALUE = {
	currentAudio: null,
	isPlaying: false,
	startAudio: async () => {},
	stopAudio: async () => {},
	togglePlayPause: async () => {},
	setIsPlaying: () => {},
	isReady: false,
	position: 0,
	duration: 0,
	seekTo: async () => {},
};

function DelayedTrackPlayerProvider({ children }) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			setReady(true);
		});
		return () => task.cancel();
	}, []);

	if (!ready) {
		return (
			<AudioContext.Provider value={FALLBACK_AUDIO_VALUE}>
				{children}
			</AudioContext.Provider>
		);
	}

	try {
		const mod = require('./AudioContextTrackPlayer');
		const TrackPlayerProvider = mod?.AudioProvider;
		if (TrackPlayerProvider) {
			return <TrackPlayerProvider>{children}</TrackPlayerProvider>;
		}
	} catch (_) {}
	return (
		<AudioContext.Provider value={FALLBACK_AUDIO_VALUE}>
			{children}
		</AudioContext.Provider>
	);
}

export function AudioProvider({ children }) {
	if (Constants.appOwnership === 'expo') {
		const ExpoGo = require('./AudioContextExpoGo').default;
		return <ExpoGo>{children}</ExpoGo>;
	}
	// Android: use expo-av to avoid TrackPlayer "CAPABILITY_PLAY of null" in dev builds
	if (Platform.OS === 'android') {
		const ExpoGo = require('./AudioContextExpoGo').default;
		return <ExpoGo>{children}</ExpoGo>;
	}
	return <DelayedTrackPlayerProvider>{children}</DelayedTrackPlayerProvider>;
}
