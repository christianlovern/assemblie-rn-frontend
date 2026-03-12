/**
 * Playback service for react-native-track-player.
 * Handles remote events from lock screen, control center, and notification.
 * Must be a separate file and registered at app startup.
 */
import TrackPlayer, { Event } from 'react-native-track-player';

export async function PlaybackService() {
	TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
	TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
	TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
	TrackPlayer.addEventListener(Event.RemoteSeek, (position) =>
		TrackPlayer.seekTo(position),
	);
}
