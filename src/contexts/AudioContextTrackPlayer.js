/**
 * Audio context implementation using react-native-track-player.
 * Used in development builds for background audio and lock screen controls.
 * Not loaded in Expo Go (native module unavailable).
 */
import React, { useState, useEffect, useCallback } from 'react';
import TrackPlayer, {
	Capability,
	State,
	usePlaybackState,
	useActiveTrack,
	useProgress,
} from 'react-native-track-player';
import { AudioContext } from './audioContextBase';

function AudioContextTrackPlayerInner({ children }) {
	const [isReady, setIsReady] = useState(false);
	const playbackState = usePlaybackState();
	const activeTrack = useActiveTrack();
	const progress = useProgress();

	const isPlaying =
		playbackState.state === State.Playing || playbackState.state === State.Ready;
	const currentAudio = activeTrack
		? { fileUrl: activeTrack.url, name: activeTrack.title ?? activeTrack.url }
		: null;

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await TrackPlayer.setupPlayer();
				if (cancelled) return;
				// Capability can be null on Android until native module is ready
				const Cap = Capability;
				if (Cap) {
					await TrackPlayer.updateOptions({
						capabilities: [
							Cap.Play,
							Cap.Pause,
							Cap.Stop,
						],
						compactCapabilities: [Cap.Play, Cap.Pause],
					});
				}
				if (!cancelled) setIsReady(true);
			} catch (_) {
				if (!cancelled) setIsReady(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const startAudio = useCallback(async (fileUrl, name) => {
		if (!isReady) return;
		try {
			await TrackPlayer.reset();
			await TrackPlayer.add({
				id: fileUrl,
				url: fileUrl,
				title: name || 'Audio',
				artist: 'Assemblie',
			});
			await TrackPlayer.play();
		} catch (_) {
			await TrackPlayer.reset();
		}
	}, [isReady]);

	const stopAudio = useCallback(async () => {
		try {
			await TrackPlayer.reset();
		} catch (_) {}
	}, []);

	const togglePlayPause = useCallback(async () => {
		try {
			const state = await TrackPlayer.getPlaybackState();
			if (state.state === State.Playing || state.state === State.Ready) {
				await TrackPlayer.pause();
			} else {
				await TrackPlayer.play();
			}
		} catch (_) {}
	}, []);

	const setIsPlaying = useCallback(() => {}, []);

	return (
		<AudioContext.Provider
			value={{
				currentAudio,
				isPlaying,
				startAudio,
				stopAudio,
				togglePlayPause,
				setIsPlaying,
				isReady,
				position: progress.position,
				duration: progress.duration,
				seekTo: TrackPlayer.seekTo,
			}}>
			{children}
		</AudioContext.Provider>
	);
}

export function AudioProvider({ children }) {
	return <AudioContextTrackPlayerInner>{children}</AudioContextTrackPlayerInner>;
}
