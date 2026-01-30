import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	ActivityIndicator,
	TouchableOpacity,
	Linking,
	Platform,
	Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Image } from 'react-native-expo-image-cache';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { mediaApi } from '../../../api/mediaRoutes';
import Background from '../../../shared/components/Background';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { lightenColor } from '../../../shared/helper/colorFixer';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { typography } from '../../../shared/styles/typography';
import { useAudio } from '../../contexts/AudioContext';

const { width, height } = Dimensions.get('window');

const AudioPlayer = ({ fileUrl, fileName, organization }) => {
	const { startAudio, stopAudio, isPlaying, setIsPlaying } = useAudio();
	const [sound, setSound] = useState(null);
	const [duration, setDuration] = useState(0);
	const [position, setPosition] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const { colors } = useTheme();
	useEffect(() => {
		loadAudio();
		return () => {
			if (sound) {
				sound.unloadAsync();
			}
		};
	}, [fileUrl]);

	const loadAudio = async () => {
		try {
			setIsLoading(true);
			const { sound: audioSound } = await Audio.Sound.createAsync(
				{ uri: fileUrl },
				{ shouldPlay: false },
				onPlaybackStatusUpdate,
			);
			setSound(audioSound);
			startAudio(fileUrl, fileName, audioSound);
		} catch (error) {
			console.error('Error loading audio:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const onPlaybackStatusUpdate = (status) => {
		if (status.isLoaded) {
			setDuration(status.durationMillis);
			setPosition(status.positionMillis);
			setIsPlaying(status.isPlaying);
		}
	};

	const formatTime = (millis) => {
		if (!millis) return '0:00';
		const minutes = Math.floor(millis / 60000);
		const seconds = ((millis % 60000) / 1000).toFixed(0);
		return `${minutes}:${seconds.padStart(2, '0')}`;
	};

	const handlePlayPause = async () => {
		try {
			if (!sound) {
				await loadAudio();
				return;
			}

			if (isPlaying) {
				await sound.pauseAsync();
				setIsPlaying(false);
			} else {
				await sound.playAsync();
				setIsPlaying(true);
			}
		} catch (error) {
			console.error('Error in handlePlayPause:', error);
			// If there's an error, try to reload the audio
			loadAudio();
		}
	};

	const handleSeek = async (value) => {
		if (sound) {
			try {
				await sound.setPositionAsync(value);
			} catch (error) {
				console.error('Error seeking:', error);
			}
		}
	};

	const handleRewind = async () => {
		if (sound) {
			try {
				const newPosition = Math.max(0, position - 10000);
				await sound.setPositionAsync(newPosition);
			} catch (error) {
				console.error('Error rewinding:', error);
			}
		}
	};

	const handleForward = async () => {
		if (sound) {
			try {
				const newPosition = Math.min(duration, position + 10000);
				await sound.setPositionAsync(newPosition);
			} catch (error) {
				console.error('Error forwarding:', error);
			}
		}
	};

	if (isLoading) {
		return (
			<View style={styles.audioControls}>
				<ActivityIndicator
					size='large'
					color={organization.primaryColor}
				/>
			</View>
		);
	}

	return (
		<View style={styles.audioControls}>
			<Slider
				style={styles.audioSlider}
				minimumValue={0}
				maximumValue={duration}
				value={position}
				onSlidingComplete={handleSeek}
				minimumTrackTintColor={colors.textWhite}
				maximumTrackTintColor='rgba(255, 255, 255, 0.3)'
				thumbTintColor={colors.textWhite}
				thumbStyle={styles.sliderThumb}
			/>
			<View style={styles.audioTimeContainer}>
				<Text style={styles.audioTime}>{formatTime(position)}</Text>
				<Text style={styles.audioTime}>{formatTime(duration)}</Text>
			</View>
			<View style={styles.audioButtonsContainer}>
				<TouchableOpacity
					style={styles.audioButton}
					onPress={handleRewind}>
					<Icon
						name='rewind-10'
						size={24}
						color='white'
					/>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.audioButton}
					onPress={handlePlayPause}>
					<Icon
						name={isPlaying ? 'pause' : 'play'}
						size={24}
						color='white'
					/>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.audioButton}
					onPress={handleForward}>
					<Icon
						name='fast-forward-10'
						size={24}
						color='white'
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const FileViewScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { organization } = useData();
	const { colors, colorMode } = useTheme();
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [pdfUri, setPdfUri] = useState(null);
	const fileId = route?.params?.fileId;
	const returnFolderId = route?.params?.returnFolderId;

	useEffect(() => {
		loadFile();
	}, [fileId]);

	useEffect(() => {
		if (
			file &&
			(file.fileType.toLowerCase() === 'pdf' ||
				file.fileType.toLowerCase() === 'application/pdf' ||
				file.fileUrl.endsWith('.pdf'))
		) {
			const loadPDF = async () => {
				const uri = await renderPDFContent(file.fileUrl, file.name);
				setPdfUri(uri);
			};
			loadPDF();
		}
	}, [file]);

	const loadFile = async () => {
		try {
			setLoading(true);
			const fileData = await mediaApi.getOne(fileId);
			setFile(fileData);
		} catch (error) {
			console.error('Error loading file:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		if (returnFolderId) {
			navigation.navigate('Media', { folderId: returnFolderId });
		} else {
			navigation.goBack();
		}
	};

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: false, // Use custom header to match app style
		});
	}, [navigation, file, returnFolderId]);

	const getGoogleDocsViewerUrl = (fileUrl) => {
		return `https://docs.google.com/viewer?url=${encodeURIComponent(
			fileUrl,
		)}&embedded=true`;
	};

	const handleAndroidPDF = async (fileUrl, fileName) => {
		try {
			setLoading(true);

			// Ensure valid filename with .pdf extension
			const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
			const fileNameWithExt = sanitizedFileName.endsWith('.pdf')
				? sanitizedFileName
				: `${sanitizedFileName}.pdf`;
			const localUri = FileSystem.documentDirectory + fileNameWithExt;

			const downloadResult = await FileSystem.downloadAsync(
				fileUrl,
				localUri,
			);

			if (downloadResult.status !== 200) {
				throw new Error(
					`Failed to download PDF: Status ${downloadResult.status}`,
				);
			}

			try {
				await IntentLauncher.startActivityAsync(
					'android.intent.action.VIEW',
					{
						data: downloadResult.uri,
						flags: 1,
						type: 'application/pdf',
					},
				);
			} catch (intentError) {
				const canShare = await Sharing.isAvailableAsync();
				if (canShare) {
					await Sharing.shareAsync(downloadResult.uri, {
						mimeType: 'application/pdf',
						dialogTitle: 'Open PDF with...',
						UTI: 'com.adobe.pdf',
					});
				} else {
					Alert.alert(
						'No PDF Viewer',
						'Please install a PDF viewer app to open this file.',
						[{ text: 'OK' }],
					);
				}
			}
		} catch (error) {
			console.error('Error handling PDF:', error);
			Alert.alert('Error', 'Failed to open PDF file: ' + error.message, [
				{ text: 'OK' },
			]);
		} finally {
			setLoading(false);
		}
	};

	const renderPDFContent = async (fileUrl, fileName) => {
		try {
			setLoading(true);

			// Ensure valid filename with .pdf extension
			const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
			const fileNameWithExt = sanitizedFileName.endsWith('.pdf')
				? sanitizedFileName
				: `${sanitizedFileName}.pdf`;
			const localUri = FileSystem.documentDirectory + fileNameWithExt;

			const downloadResult = await FileSystem.downloadAsync(
				fileUrl,
				localUri,
			);

			if (downloadResult.status !== 200) {
				throw new Error(
					`Failed to download PDF: Status ${downloadResult.status}`,
				);
			}

			return downloadResult.uri;
		} catch (error) {
			console.error('Error handling PDF:', error);
			Alert.alert('Error', 'Failed to load PDF file: ' + error.message, [
				{ text: 'OK' },
			]);
			return null;
		} finally {
			setLoading(false);
		}
	};

	const renderFileContent = () => {
		if (!file) return null;

		const fileType = file.fileType.toLowerCase();

		// Image files
		if (fileType.match(/^(jpg|jpeg|png|gif)$/)) {
			return (
				<Image
					uri={file.fileUrl}
					style={styles.image}
					resizeMode='contain'
				/>
			);
		}

		// Video files
		if (fileType.match(/^(mp4|mov|video\/mp4|video\/quicktime)$/)) {
			return (
				<View style={styles.videoContainer}>
					<WebView
						source={{
							html: `
								<!DOCTYPE html>
								<html>
									<head>
										<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
										<style>
											body {
												margin: 0;
												padding: 0;
												background-color: #000;
												display: flex;
												justify-content: center;
												align-items: center;
												height: 100vh;
											}
											video {
												width: 100%;
												height: 100%;
												max-height: 100vh;
												object-fit: contain;
											}
										</style>
									</head>
									<body>
										<video 
											controls 
											autoplay
											playsinline
											webkit-playsinline
										>
											<source src="${file.fileUrl}" type="video/mp4">
											Your browser does not support the video tag.
										</video>
									</body>
								</html>
							`,
						}}
						style={styles.videoWebView}
						allowsFullscreenVideo={true}
						mediaPlaybackRequiresUserAction={false}
						javaScriptEnabled={true}
						domStorageEnabled={true}
					/>
				</View>
			);
		}

		// PDF files
		if (
			fileType === 'pdf' ||
			fileType === 'application/pdf' ||
			file.fileUrl.endsWith('.pdf')
		) {
			return (
				<View style={styles.pdfContainer}>
					<WebView
						source={{
							uri: getGoogleDocsViewerUrl(file.fileUrl),
						}}
						style={styles.webview}
						onError={(syntheticEvent) => {
							const { nativeEvent } = syntheticEvent;
							console.warn('WebView error: ', nativeEvent);
						}}
						startInLoadingState={true}
						renderLoading={() => (
							<ActivityIndicator
								size='large'
								color={organization.primaryColor}
								style={styles.loadingIndicator}
							/>
						)}
					/>
					<TouchableOpacity
						style={[
							styles.downloadButton,
							{ backgroundColor: organization.primaryColor },
						]}
						onPress={() => Linking.openURL(file.fileUrl)}>
						<Icon
							name='download'
							size={24}
							color='white'
						/>
						<Text style={styles.downloadText}>Download PDF</Text>
					</TouchableOpacity>
				</View>
			);
		}

		// Audio files
		if (fileType.match(/^(mp3|wav|m4a|audio\/.*)$/)) {
			return (
				<View
					style={[
						styles.audioContainer,
						{
							borderColor: lightenColor(
								organization.primaryColor,
							),
							backgroundColor: lightenColor(
								organization.primaryColor,
								0.2,
							),
						},
					]}>
					<Icon
						name='music'
						size={50}
						color={lightenColor(organization.primaryColor)}
					/>
					<Text
						style={[
							styles.audioText,
							{
								color: colors.textWhite,
							},
						]}>
						{file.name}
					</Text>
					<AudioPlayer
						fileUrl={file.fileUrl}
						fileName={file.name}
						organization={organization}
					/>
				</View>
			);
		}

		// Other file types
		return (
			<WebView
				source={{ uri: file.fileUrl }}
				style={styles.webview}
			/>
		);
	};

	return (
		<Background
			primaryColor={organization?.primaryColor}
			secondaryColor={organization?.secondaryColor}>
			{/* Custom Header */}
			<View style={styles.headerContainer}>
				<TouchableOpacity
					onPress={handleBack}
					style={styles.backButton}>
					<Icon
						name='arrow-left'
						size={24}
						color={organization?.secondaryColor || colors.text}
					/>
				</TouchableOpacity>
				<Text
					style={[
						styles.headerTitle,
						{
							color: lightenColor(organization?.primaryColor),
						},
					]}
					numberOfLines={1}>
					{file?.name || 'File View'}
				</Text>
				<View style={{ width: 40 }} />
			</View>

			<View style={styles.container}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator
							size='large'
							color={organization?.primaryColor}
						/>
					</View>
				) : (
					renderFileContent()
				)}
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	headerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 16,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		...typography.h2,
		fontSize: 20,
		fontWeight: '600',
		flex: 1,
		textAlign: 'center',
	},
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: width,
		height: height,
		resizeMode: 'contain',
	},
	videoContainer: {
		flex: 1,
		backgroundColor: '#000',
	},
	videoWebView: {
		flex: 1,
		backgroundColor: '#000',
	},
	pdfContainer: {
		flex: 1,
		position: 'relative',
	},
	webview: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	loadingIndicator: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -25 }, { translateY: -25 }],
	},
	downloadButton: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 25,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	downloadText: {
		...typography.button,
		color: 'white',
		marginLeft: 8,
	},
	audioContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		borderWidth: 1,
		borderRadius: 10,
		margin: 20,
		marginTop: 80, // Add some space from the top
	},
	audioText: {
		...typography.h3,
		marginVertical: 20,
		textAlign: 'center',
	},
	audioControls: {
		width: '100%',
		alignItems: 'center',
		marginTop: 20,
	},
	audioSlider: {
		width: '100%',
		height: 40,
	},
	audioTimeContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginTop: 10,
	},
	audioTime: {
		...typography.body,
		color: 'white',
	},
	audioButtonsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 20,
		gap: 20,
	},
	audioButton: {
		padding: 10,
		borderRadius: 25,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		...typography.body,
		color: 'white',
		textAlign: 'center',
		marginTop: 10,
	},
	sliderThumb: {
		width: 16,
		height: 16,
		backgroundColor: 'white',
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
});

export default FileViewScreen;
