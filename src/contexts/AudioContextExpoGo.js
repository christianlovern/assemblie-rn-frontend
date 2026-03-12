/**
 * Audio context implementation using expo-av.
 * Used in Expo Go where react-native-track-player is not available.
 * No background playback or lock screen controls in this mode.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { AudioContext } from './audioContextBase';

function AudioContextExpoGoInner({ children }) {
	const [currentAudio, setCurrentAudio] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [isReady, setIsReady] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: false,
					staysActiveInBackground: true,
					playsInSilentModeIOS: true,
					shouldDuckAndroid: true,
					playThroughEarpieceAndroid: false,
				});
			} catch (_) {}
		})();
	}, []);

	const startAudio = useCallback(
		async (fileUrl, name) => {
			try {
				if (currentAudio?.sound) {
					await currentAudio.sound.unloadAsync();
				}
				const { sound } = await Audio.Sound.createAsync(
					{ uri: fileUrl },
					{ shouldPlay: true },
					(status) => {
						if (status.isLoaded) {
							setPosition(status.positionMillis / 1000);
							setDuration(status.durationMillis / 1000);
							setIsPlaying(status.isPlaying);
						}
					},
				);
				setCurrentAudio({ fileUrl, name, sound });
				setIsPlaying(true);
			} catch (_) {
				setCurrentAudio(null);
				setIsPlaying(false);
			}
		},
		[currentAudio?.sound],
	);

	const stopAudio = useCallback(async () => {
		try {
			if (currentAudio?.sound) {
				await currentAudio.sound.stopAsync();
				await currentAudio.sound.unloadAsync();
			}
			setCurrentAudio(null);
			setIsPlaying(false);
			setPosition(0);
			setDuration(0);
		} catch (_) {
			setCurrentAudio(null);
			setIsPlaying(false);
		}
	}, [currentAudio?.sound]);

	const togglePlayPause = useCallback(async () => {
		if (!currentAudio?.sound) return;
		try {
			const status = await currentAudio.sound.getStatusAsync();
			if (status.isLoaded) {
				if (isPlaying) {
					await currentAudio.sound.pauseAsync();
				} else {
					await currentAudio.sound.playAsync();
				}
				setIsPlaying(!isPlaying);
			}
		} catch (_) {}
	}, [currentAudio?.sound, isPlaying]);

	const setIsPlayingNoop = useCallback(() => {}, []);

	const seekTo = useCallback(
		async (seconds) => {
			if (!currentAudio?.sound) return;
			try {
				await currentAudio.sound.setPositionAsync(seconds * 1000);
				setPosition(seconds);
			} catch (_) {}
		},
		[currentAudio?.sound],
	);

	return (
		<AudioContext.Provider
			value={{
				currentAudio: currentAudio
					? { fileUrl: currentAudio.fileUrl, name: currentAudio.name }
					: null,
				isPlaying,
				startAudio,
				stopAudio,
				togglePlayPause,
				setIsPlaying: setIsPlayingNoop,
				isReady,
				position,
				duration,
				seekTo,
			}}>
			{children}
		</AudioContext.Provider>
	);
}

export default function AudioContextExpoGo({ children }) {
	return <AudioContextExpoGoInner>{children}</AudioContextExpoGoInner>;
}
