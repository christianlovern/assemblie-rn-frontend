import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
	const [currentAudio, setCurrentAudio] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	// currentAudio shape: { fileUrl: string, name: string, sound: Audio.Sound }

	useEffect(() => {
		setupAudio();
		return () => {
			if (currentAudio?.sound) {
				currentAudio.sound.unloadAsync();
			}
		};
	}, []);

	const setupAudio = async () => {
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				staysActiveInBackground: true,
				playsInSilentModeIOS: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
			});
		} catch (error) {
			console.error('Error setting up audio:', error);
		}
	};

	const startAudio = async (fileUrl, name, sound) => {
		try {
			// Clean up previous audio if it exists
			if (currentAudio?.sound) {
				await currentAudio.sound.unloadAsync();
				setCurrentAudio(null);
				setIsPlaying(false);
			}

			// Set up new audio
			setCurrentAudio({ fileUrl, name, sound });
			await sound.playAsync();
			setIsPlaying(true);
		} catch (error) {
			console.error('Error starting audio:', error);
			// Reset state on error
			setCurrentAudio(null);
			setIsPlaying(false);
		}
	};

	const stopAudio = async () => {
		try {
			if (currentAudio?.sound) {
				await currentAudio.sound.stopAsync();
				await currentAudio.sound.unloadAsync();
			}
			setCurrentAudio(null);
			setIsPlaying(false);
		} catch (error) {
			console.error('Error stopping audio:', error);
			// Reset state on error
			setCurrentAudio(null);
			setIsPlaying(false);
		}
	};

	const togglePlayPause = async () => {
		if (!currentAudio?.sound) {
			return;
		}

		try {
			const status = await currentAudio.sound.getStatusAsync();

			if (status.isLoaded) {
				if (isPlaying) {
					await currentAudio.sound.pauseAsync();
				} else {
					await currentAudio.sound.playAsync();
				}
				setIsPlaying(!isPlaying);
			} else {
				// If audio is not loaded, try to reload it
				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri: currentAudio.fileUrl },
					{ shouldPlay: true }
				);
				setCurrentAudio({ ...currentAudio, sound: newSound });
				setIsPlaying(true);
			}
		} catch (error) {
			console.error('Error toggling play/pause:', error);
			// Reset state on error
			setCurrentAudio(null);
			setIsPlaying(false);
		}
	};

	return (
		<AudioContext.Provider
			value={{
				currentAudio,
				isPlaying,
				startAudio,
				stopAudio,
				togglePlayPause,
				setIsPlaying,
			}}>
			{children}
		</AudioContext.Provider>
	);
};

export const useAudio = () => {
	const context = useContext(AudioContext);
	if (!context) {
		throw new Error('useAudio must be used within an AudioProvider');
	}
	return context;
};
