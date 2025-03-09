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
import { MaterialCommunityIcons as Icon } from 'react-native-vector-icons';
import { useData } from '../../../context';
import { mediaApi } from '../../../api/mediaRoutes';
import Background from '../../../shared/components/Background';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { lightenColor } from '../../../shared/helper/colorFixer';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

const FileViewScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { organization } = useData();
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
			headerShown: true,
			headerLeft: () => (
				<TouchableOpacity
					onPress={handleBack}
					style={{ marginLeft: 16 }}>
					<Icon
						name='arrow-left'
						size={24}
						color={organization.secondaryColor}
					/>
				</TouchableOpacity>
			),
			headerTitle: file?.name || 'File View',
			headerTitleAlign: 'center',
			headerStyle: {
				backgroundColor: 'transparent',
				elevation: 0,
				shadowOpacity: 0,
			},
			headerTransparent: true,
			headerTitleStyle: {
				color: organization.secondaryColor,
				fontSize: 18,
				fontWeight: '600',
			},
			headerTintColor: organization.primaryColor,
		});
	}, [navigation, file, returnFolderId]);

	const getGoogleDocsViewerUrl = (fileUrl) => {
		return `https://docs.google.com/viewer?url=${encodeURIComponent(
			fileUrl
		)}&embedded=true`;
	};

	const handleAndroidPDF = async (fileUrl, fileName) => {
		try {
			setLoading(true);
			console.log('Starting PDF download:', fileUrl);

			// Ensure valid filename with .pdf extension
			const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
			const fileNameWithExt = sanitizedFileName.endsWith('.pdf')
				? sanitizedFileName
				: `${sanitizedFileName}.pdf`;
			const localUri = FileSystem.documentDirectory + fileNameWithExt;

			console.log('Downloading to:', localUri);

			const downloadResult = await FileSystem.downloadAsync(
				fileUrl,
				localUri
			);

			console.log('Download result:', downloadResult);

			if (downloadResult.status !== 200) {
				throw new Error(
					`Failed to download PDF: Status ${downloadResult.status}`
				);
			}

			try {
				console.log('Attempting to open with native viewer');
				await IntentLauncher.startActivityAsync(
					'android.intent.action.VIEW',
					{
						data: downloadResult.uri,
						flags: 1,
						type: 'application/pdf',
					}
				);
			} catch (intentError) {
				console.log(
					'Native viewer failed, trying sharing:',
					intentError
				);
				const canShare = await Sharing.isAvailableAsync();
				if (canShare) {
					console.log('Sharing PDF...');
					await Sharing.shareAsync(downloadResult.uri, {
						mimeType: 'application/pdf',
						dialogTitle: 'Open PDF with...',
						UTI: 'com.adobe.pdf',
					});
				} else {
					console.log('No sharing available');
					Alert.alert(
						'No PDF Viewer',
						'Please install a PDF viewer app to open this file.',
						[{ text: 'OK' }]
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
			console.log('Starting PDF download:', fileUrl);

			// Ensure valid filename with .pdf extension
			const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
			const fileNameWithExt = sanitizedFileName.endsWith('.pdf')
				? sanitizedFileName
				: `${sanitizedFileName}.pdf`;
			const localUri = FileSystem.documentDirectory + fileNameWithExt;

			console.log('Downloading to:', localUri);

			const downloadResult = await FileSystem.downloadAsync(
				fileUrl,
				localUri
			);

			console.log('Download result:', downloadResult);

			if (downloadResult.status !== 200) {
				throw new Error(
					`Failed to download PDF: Status ${downloadResult.status}`
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
		console.log('File type:', fileType);
		console.log('File URL:', file.fileUrl);

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
								organization.primaryColor
							),
							backgroundColor: lightenColor(
								organization.primaryColor,
								0.2
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
								color: lightenColor(
									organization.secondaryColor
								),
							},
						]}>
						{file.name}
					</Text>
					<AudioPlayer
						fileUrl={file.fileUrl}
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

	if (loading) {
		return (
			<Background>
				<View style={styles.container}>
					<ActivityIndicator
						size='large'
						color={organization.primaryColor}
					/>
				</View>
			</Background>
		);
	}

	return (
		<Background>
			<View style={styles.container}>{renderFileContent()}</View>
		</Background>
	);
};

const AudioPlayer = ({ fileUrl, organization }) => {
	const [sound, setSound] = useState();
	const [isPlaying, setIsPlaying] = useState(false);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		return sound
			? () => {
					sound.unloadAsync();
			  }
			: undefined;
	}, [sound]);

	useEffect(() => {
		if (sound && isPlaying) {
			const interval = setInterval(async () => {
				const status = await sound.getStatusAsync();
				setPosition(status.positionMillis);
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [sound, isPlaying]);

	const playSound = async () => {
		if (sound) {
			if (isPlaying) {
				await sound.pauseAsync();
				setIsPlaying(false);
			} else {
				await sound.playAsync();
				setIsPlaying(true);
			}
		} else {
			try {
				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri: fileUrl },
					{ shouldPlay: true },
					(status) => {
						if (status.isLoaded) {
							setPosition(status.positionMillis);
							setDuration(status.durationMillis);
							setIsPlaying(status.isPlaying);
						}
					}
				);
				setSound(newSound);
				setIsLoaded(true);
				setIsPlaying(true);
			} catch (error) {
				console.error('Error loading audio:', error);
			}
		}
	};

	const onSeek = async (value) => {
		if (sound) {
			await sound.setPositionAsync(value);
			setPosition(value);
		}
	};

	const skipAudio = async (skipAmount) => {
		if (sound) {
			const status = await sound.getStatusAsync();
			const newPosition = Math.min(
				Math.max(status.positionMillis + skipAmount, 0),
				duration
			);
			await sound.setPositionAsync(newPosition);
			setPosition(newPosition);
		}
	};

	const formatTime = (millis) => {
		if (!millis) return '0:00';
		const minutes = Math.floor(millis / 60000);
		const seconds = ((millis % 60000) / 1000).toFixed(0);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};

	return (
		<View style={styles.playerContainer}>
			<View style={styles.controlsContainer}>
				<TouchableOpacity
					onPress={() => skipAudio(-15000)}
					style={styles.skipButton}>
					<Icon
						name='rewind-15'
						size={30}
						color={'white'}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={playSound}
					style={styles.playButton}>
					<Icon
						name={isPlaying ? 'pause' : 'play'}
						size={40}
						color={organization.primaryColor}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => skipAudio(15000)}
					style={styles.skipButton}>
					<Icon
						name='fast-forward-15'
						size={30}
						color={'white'}
					/>
				</TouchableOpacity>
			</View>

			<View style={styles.progressContainer}>
				<Text style={styles.timeText}>{formatTime(position)}</Text>
				<View style={styles.sliderContainer}>
					<Slider
						style={styles.slider}
						minimumValue={0}
						maximumValue={duration}
						value={position}
						onSlidingComplete={onSeek}
						minimumTrackTintColor={organization.primaryColor}
						maximumTrackTintColor='#ddd'
						thumbTintColor={organization.primaryColor}
						disabled={!isLoaded}
					/>
				</View>
				<Text style={styles.timeText}>{formatTime(duration)}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 60,
		paddingHorizontal: 20,
	},
	image: {
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height - 100,
	},
	videoContainer: {
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height - 100,
		backgroundColor: '#000',
	},
	videoWebView: {
		flex: 1,
		backgroundColor: '#000',
	},
	audioContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		marginHorizontal: 20,
		width: '100%',
		height: 300,
		borderWidth: 3,
		borderRadius: 10,
	},
	audioText: {
		marginTop: 10,
		marginBottom: 20,
		fontSize: 16,
	},
	playerContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		width: '100%',
		height: 120,
	},
	playButton: {
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: 10,
		marginBottom: 10,
	},
	progressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		paddingHorizontal: 20,
		marginTop: 20,
	},
	sliderContainer: {
		flex: 1,
		marginHorizontal: 10,
		transform: [{ scaleY: 1.5 }],
	},
	slider: {
		flex: 1,
		marginHorizontal: 10,
		// transform: [{ scaleY: 2 }],
	},
	timeText: {
		fontSize: 12,
		color: 'white',
		minWidth: 35,
	},
	webview: {
		flex: 1,
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height - 100,
	},
	pdfContainer: {
		flex: 1,
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height - 100,
	},
	controlsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	skipButton: {
		backgroundColor: 'transparent',
		borderRadius: 25,
		padding: 12,
		marginHorizontal: 20,
	},
	downloadButton: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 25,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	downloadText: {
		color: 'white',
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
	},
	androidPdfPrompt: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	pdfTitle: {
		fontSize: 16,
		textAlign: 'center',
		marginVertical: 20,
		color: '#333',
	},
	openPdfButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 15,
		borderRadius: 25,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	openPdfText: {
		color: 'white',
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
	},
	loadingIndicator: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default FileViewScreen;
