import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from 'react-native-vector-icons';
import { useAudio } from '../../src/contexts/AudioContext';
import { useData } from '../../context';
import { typography } from '../../shared/styles/typography';
const { width } = Dimensions.get('window');

const MiniPlayer = () => {
	const { currentAudio, stopAudio } = useAudio();
	const { organization } = useData();
	const [isPlaying, setIsPlaying] = useState(false);

	if (!currentAudio) return null;

	const handlePlayPause = async () => {
		if (!currentAudio.sound) return;

		try {
			if (isPlaying) {
				await currentAudio.sound.pauseAsync();
			} else {
				await currentAudio.sound.playAsync();
			}
			setIsPlaying(!isPlaying);
		} catch (error) {
			console.error('Error toggling play/pause:', error);
		}
	};

	const handleClose = async () => {
		await stopAudio();
	};

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: organization.primaryColor },
			]}>
			<Icon
				name='music'
				size={24}
				color={organization.secondaryColor}
				style={styles.icon}
			/>
			<Text
				style={[styles.title, { color: organization.secondaryColor }]}
				numberOfLines={1}>
				{currentAudio.name}
			</Text>
			<View style={styles.controls}>
				<TouchableOpacity onPress={handlePlayPause}>
					<Icon
						name={isPlaying ? 'pause' : 'play'}
						size={24}
						color={organization.secondaryColor}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={handleClose}
					style={styles.closeButton}>
					<Icon
						name='close'
						size={24}
						color={organization.secondaryColor}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	icon: {
		marginRight: 12,
	},
	title: {
		...typography.body,
		flex: 1,
		marginRight: 12,
	},
	controls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	closeButton: {
		marginLeft: 8,
	},
});

export default MiniPlayer;
