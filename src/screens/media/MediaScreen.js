import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Image,
	TextInput,
	StyleSheet,
	Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from 'react-native-vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useData } from '../../../context';
import { foldersApi } from '../../../api/folderRoutes';
import { mediaApi } from '../../../api/mediaRoutes';
import Background from '../../../shared/components/Background';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { typography } from '../../../shared/styles/typography';
import loader from '../../../assets/loader.gif';

const { width } = Dimensions.get('window');
const GRID_SPACING = 16;
const ITEMS_PER_ROW = 2;
const ITEM_WIDTH = (width - GRID_SPACING * (ITEMS_PER_ROW + 1)) / ITEMS_PER_ROW;

const MediaScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const currentFolderId = route?.params?.folderId;
	const { organization } = useData();
	const [folders, setFolders] = useState([]);
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentFolderName, setCurrentFolderName] = useState('Media');
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredFolders, setFilteredFolders] = useState([]);
	const [filteredFiles, setFilteredFiles] = useState([]);

	// Add useEffect to get current folder name
	useEffect(() => {
		const getCurrentFolderName = async () => {
			if (currentFolderId) {
				try {
					const allFolders = await foldersApi.getAll(organization.id);
					const currentFolder = allFolders.find(
						(f) => f.id === currentFolderId
					);
					setCurrentFolderName(currentFolder?.name || 'Media');
				} catch (error) {
					console.error('Error getting folder name:', error);
					setCurrentFolderName('Media');
				}
			} else {
				setCurrentFolderName('Media');
			}
		};
		getCurrentFolderName();
	}, [currentFolderId]);

	// Update header configuration
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: true,
			headerLeft: () =>
				currentFolderId ? (
					<TouchableOpacity
						onPress={() =>
							navigation.navigate('Media', {
								folderId: undefined,
							})
						}
						style={{
							marginLeft: 16,
							width: 40,
							height: 40,
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Icon
							name='arrow-left'
							size={30}
							color={organization.secondaryColor}
						/>
					</TouchableOpacity>
				) : null,
			headerTitle: currentFolderName,
			headerTitleAlign: 'center',
			headerStyle: {
				backgroundColor: `${organization.primaryColor}`,
				elevation: 0, // for Android
				shadowOpacity: 0, // for iOS
			},
			headerTitleStyle: {
				...typography.h3,
				color: organization.secondaryColor,
				textAlign: 'center',
			},
			headerTintColor: organization.primaryColor,
		});
	}, [navigation, currentFolderId, currentFolderName]);

	useEffect(() => {
		loadContent();
	}, [currentFolderId, organization?.id]);

	const loadContent = async () => {
		try {
			if (!organization?.id) {
				return;
			}

			setLoading(true);
			const [foldersData, filesData] = await Promise.all([
				foldersApi.getAll(organization.id),
				mediaApi.getAll(organization.id),
			]);

			// Filter folders to show only public folders in the current folder
			const publicFolders = foldersData.filter(
				(folder) =>
					folder.visibility === 'public' &&
					(currentFolderId
						? folder.parentFolder === currentFolderId
						: !folder.parentFolder)
			);

			// Filter files to show only files in the current folder
			const folderFiles = filesData.filter((file) =>
				currentFolderId
					? file.folderId === currentFolderId
					: !file.folderId
			);

			setFolders(publicFolders);
			setFiles(folderFiles);
		} catch (error) {
			console.error('Error loading media content:', error);
		} finally {
			setLoading(false);
		}
	};

	const getFileTypeIcon = (fileType) => {
		switch (fileType.toLowerCase()) {
			case 'pdf':
			case 'application/pdf':
				return 'file-pdf-box';
			case 'doc':
			case 'docx':
				return 'file-word';
			case 'xls':
			case 'xlsx':
				return 'file-excel';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'image/jpeg':
			case 'image/png':
				return 'file-image';
			case 'mp4':
			case 'mov':
			case 'video/mp4':
			case 'video/mov':
				return 'file-video';
			case 'mp3':
			case 'mpeg':
			case 'wav':
			case 'm4a':
			case 'audio/mpeg':
			case 'audio/mp3':
			case 'audio/wav':
			case 'audio/m4a':
				return 'music';
			default:
				return 'file';
		}
	};

	const handleFolderPress = (folder) => {
		navigation.navigate('Media', { folderId: folder.id });
	};

	const handleFilePress = (file) => {
		navigation.navigate('FileView', {
			fileId: file.id,
			returnFolderId: currentFolderId, // Pass the current folder ID
		});
	};

	const FolderCard = ({ folder }) => (
		<TouchableOpacity
			style={styles.folderCard}
			onPress={() => handleFolderPress(folder)}>
			{folder.coverPhotoUrl ? (
				<Image
					source={{ uri: folder.coverPhotoUrl }}
					style={styles.folderCover}
				/>
			) : (
				<Icon
					name='folder'
					size={50}
					color={lightenColor(organization.primaryColor)}
				/>
			)}
			<Text style={styles.folderName}>{folder.name}</Text>
		</TouchableOpacity>
	);

	const FileCard = ({ file }) => {
		const isImage = (fileType) => {
			return fileType
				.toLowerCase()
				.match(/^(jpg|jpeg|png|image\/jpeg|image\/png)$/);
		};

		const isVideo = (fileType) => {
			return fileType
				.toLowerCase()
				.match(/^(mp4|mov|video\/mp4|video\/quicktime)$/);
		};

		return (
			<TouchableOpacity
				style={styles.fileCard}
				onPress={() => handleFilePress(file)}>
				{isImage(file.fileType) ? (
					<View style={styles.thumbnailContainer}>
						<Image
							source={{ uri: file.fileUrl }}
							style={styles.filePreview}
						/>
					</View>
				) : file.thumbnailUrl ? (
					<View style={styles.thumbnailContainer}>
						<Image
							source={{ uri: file.thumbnailUrl }}
							style={styles.filePreview}
						/>
						{isVideo(file.fileType) && (
							<View style={styles.playIconOverlay}>
								<Icon
									name='play-circle'
									size={30}
									color='white'
								/>
							</View>
						)}
					</View>
				) : (
					<Icon
						name={getFileTypeIcon(file.fileType)}
						size={40}
						color={lightenColor(organization.secondaryColor)}
					/>
				)}
				<Text style={styles.fileName}>{file.name}</Text>
			</TouchableOpacity>
		);
	};

	// Add this useEffect to initialize filtered results
	useEffect(() => {
		setFilteredFolders(folders);
		setFilteredFiles(files);
	}, [folders, files]);

	// Update the search handler
	const handleSearch = async () => {
		const query = searchQuery;

		if (!query.trim()) {
			setFilteredFolders(folders);
			setFilteredFiles(files);
			return;
		}

		try {
			const searchResults = await mediaApi.search(organization.id, query);

			setFilteredFolders(searchResults.folderResults || []);
			setFilteredFiles(searchResults.fileResults || []);
		} catch (error) {
			console.error('Search error:', error);
			setFilteredFolders(folders);
			setFilteredFiles(files);
		}
	};

	if (loading) {
		return (
			<Background>
				<View style={styles.loaderContainer}>
					<Image
						source={loader}
						style={styles.loader}
					/>
				</View>
			</Background>
		);
	}

	return (
		<Background>
			<ScrollView style={styles.container}>
				<View style={styles.searchContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder='Search folders and files...'
						placeholderTextColor='#999'
						value={searchQuery}
						onChangeText={(query) => setSearchQuery(query)}
						onBlur={handleSearch}
					/>
				</View>

				{/* Folders Section */}
				{(searchQuery ? filteredFolders : folders).length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Folders</Text>
						<View style={styles.folderGrid}>
							{(searchQuery ? filteredFolders : folders).map(
								(folder) => (
									<FolderCard
										key={folder.id}
										folder={folder}
									/>
								)
							)}
						</View>
					</View>
				)}

				{/* Files Section */}
				{(searchQuery ? filteredFiles : files).length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Files</Text>
						<View style={styles.fileGrid}>
							{(searchQuery ? filteredFiles : files).map(
								(file) => (
									<FileCard
										key={file.id}
										file={file}
									/>
								)
							)}
						</View>
					</View>
				)}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: GRID_SPACING,
	},
	loaderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loader: {
		width: 50,
		height: 50,
	},
	searchContainer: {
		marginBottom: GRID_SPACING,
	},
	searchInput: {
		...typography.body,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		color: 'white',
		padding: 12,
		borderRadius: 8,
	},
	section: {
		marginBottom: GRID_SPACING * 2,
	},
	sectionTitle: {
		...typography.h2,
		color: 'white',
		marginBottom: GRID_SPACING,
	},
	folderGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -GRID_SPACING / 2,
	},
	fileGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -GRID_SPACING / 2,
	},
	folderCard: {
		width: ITEM_WIDTH,
		margin: GRID_SPACING / 2,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	folderCover: {
		width: '100%',
		height: ITEM_WIDTH * 0.75,
		borderRadius: 4,
	},
	folderName: {
		...typography.body,
		color: 'white',
		marginTop: 8,
		textAlign: 'center',
	},
	fileCard: {
		width: ITEM_WIDTH,
		margin: GRID_SPACING / 2,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
		alignItems: 'center',
	},
	thumbnailContainer: {
		width: '100%',
		height: ITEM_WIDTH * 0.75,
		borderRadius: 4,
		overflow: 'hidden',
		position: 'relative',
	},
	filePreview: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	playIconOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
	fileName: {
		...typography.body,
		color: 'white',
		marginTop: 8,
		textAlign: 'center',
	},
});

export default MediaScreen;
