import React, { useState, useEffect, useMemo } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Image,
	StyleSheet,
	Dimensions,
	TextInput,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
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
	const { colors, colorMode } = useTheme();
	const [folders, setFolders] = useState([]);
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentFolderName, setCurrentFolderName] = useState('Media');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState([]);
	const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

	// Add useEffect to get current folder name
	useEffect(() => {
		const getCurrentFolderName = async () => {
			if (currentFolderId) {
				try {
					const allFolders = await foldersApi.getAll(organization.id);
					const currentFolder = allFolders.find(
						(f) => f.id === currentFolderId,
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
			headerShown: false, // Use custom header to match app style
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
						: !folder.parentFolder),
			);

			// Filter files to show only files in the current folder
			const folderFiles = filesData.filter((file) => {
				if (currentFolderId) {
					// Check multiple possible field names for folder reference
					const fileFolderId =
						file.folderId || file.folder?.id || file.FolderId;
					return String(fileFolderId) === String(currentFolderId);
				} else {
					// Show files with no folder (root level)
					const fileFolderId =
						file.folderId || file.folder?.id || file.FolderId;
					return !fileFolderId;
				}
			});

			setFolders(publicFolders);
			setFiles(folderFiles);
		} catch (error) {
			console.error('Error loading media content:', error);
		} finally {
			setLoading(false);
		}
	};

	// Extract unique tags from files
	const availableTags = useMemo(() => {
		const tagSet = new Set();
		files.forEach((file) => {
			if (file.tags && Array.isArray(file.tags)) {
				file.tags.forEach((tag) => {
					if (tag && typeof tag === 'string') {
						tagSet.add(tag.trim());
					} else if (tag && typeof tag === 'object' && tag.name) {
						tagSet.add(tag.name.trim());
					}
				});
			}
		});
		return Array.from(tagSet).sort();
	}, [files]);

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
			style={[
				styles.folderCard,
				{
					backgroundColor:
						colorMode === 'dark'
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(255, 255, 255, 0.9)',
				},
			]}
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
			<Text style={[styles.folderName, { color: colors.text }]}>
				{folder.name}
			</Text>
		</TouchableOpacity>
	);

	// Helper function to extract tag names from a file
	const getFileTags = (file) => {
		if (!file.tags || !Array.isArray(file.tags)) return [];
		return file.tags
			.map((tag) =>
				typeof tag === 'string' ? tag.trim() : tag?.name?.trim(),
			)
			.filter((tag) => tag && tag.length > 0);
	};

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

		const fileTags = getFileTags(file);
		const displayTags = fileTags.slice(0, 2); // Show max 2 tags in grid view
		const hasMoreTags = fileTags.length > 2;

		return (
			<TouchableOpacity
				style={[
					styles.fileCard,
					{
						backgroundColor:
							colorMode === 'dark'
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(255, 255, 255, 0.9)',
					},
				]}
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
						color={lightenColor(organization.primaryColor)}
					/>
				)}
				<Text
					style={[styles.fileName, { color: colors.text }]}
					numberOfLines={1}>
					{file.name}
				</Text>
				{/* Tag Indicators */}
				{fileTags.length > 0 && (
					<View style={styles.fileTagsContainer}>
						{displayTags.map((tag, index) => (
							<View
								key={index}
								style={[
									styles.fileTagChip,
									{
										backgroundColor: lightenColor(
											organization?.primaryColor,
											30,
											0.2,
										),
									},
								]}>
								<Text
									style={[
										styles.fileTagText,
										{
											color: lightenColor(
												organization?.primaryColor,
											),
										},
									]}
									numberOfLines={1}>
									{tag}
								</Text>
							</View>
						))}
						{hasMoreTags && (
							<View
								style={[
									styles.fileTagChip,
									{
										backgroundColor: lightenColor(
											organization?.primaryColor,
											30,
											0.2,
										),
									},
								]}>
								<Text
									style={[
										styles.fileTagText,
										{
											color: lightenColor(
												organization?.primaryColor,
											),
										},
									]}>
									+{fileTags.length - 2}
								</Text>
							</View>
						)}
					</View>
				)}
			</TouchableOpacity>
		);
	};

	const FolderListItem = ({ folder }) => (
		<TouchableOpacity
			style={[
				styles.listItem,
				{
					backgroundColor:
						colorMode === 'dark'
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(255, 255, 255, 0.9)',
				},
			]}
			onPress={() => handleFolderPress(folder)}>
			<View style={styles.listItemLeft}>
				{folder.coverPhotoUrl ? (
					<Image
						source={{ uri: folder.coverPhotoUrl }}
						style={styles.listItemThumbnail}
					/>
				) : (
					<View style={styles.listItemIconContainer}>
						<Icon
							name='folder'
							size={32}
							color={lightenColor(organization.primaryColor)}
						/>
					</View>
				)}
				<Text style={[styles.listItemName, { color: colors.text }]}>
					{folder.name}
				</Text>
			</View>
			<Icon
				name='chevron-right'
				size={24}
				color={colors.textSecondary}
			/>
		</TouchableOpacity>
	);

	const FileListItem = ({ file }) => {
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

		const fileTags = getFileTags(file);
		const displayTags = fileTags.slice(0, 3); // Show max 3 tags in list view
		const hasMoreTags = fileTags.length > 3;

		return (
			<TouchableOpacity
				style={[
					styles.listItem,
					{
						backgroundColor:
							colorMode === 'dark'
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(255, 255, 255, 0.9)',
					},
				]}
				onPress={() => handleFilePress(file)}>
				<View style={styles.listItemLeft}>
					{isImage(file.fileType) && file.fileUrl ? (
						<Image
							source={{ uri: file.fileUrl }}
							style={styles.listItemThumbnail}
						/>
					) : file.thumbnailUrl ? (
						<Image
							source={{ uri: file.thumbnailUrl }}
							style={styles.listItemThumbnail}
						/>
					) : (
						<View style={styles.listItemIconContainer}>
							<Icon
								name={getFileTypeIcon(file.fileType)}
								size={32}
								color={lightenColor(organization.primaryColor)}
							/>
						</View>
					)}
					<View style={styles.listItemContent}>
						<Text
							style={[
								styles.listItemName,
								{ color: colors.text },
							]}
							numberOfLines={1}>
							{file.name}
						</Text>
						{/* Tag Indicators */}
						{fileTags.length > 0 && (
							<View style={styles.listItemTagsContainer}>
								{displayTags.map((tag, index) => (
									<View
										key={index}
										style={[
											styles.listItemTagChip,
											{
												backgroundColor: lightenColor(
													organization?.primaryColor,
													30,
													0.2,
												),
											},
										]}>
										<Text
											style={[
												styles.listItemTagText,
												{
													color: lightenColor(
														organization?.primaryColor,
													),
												},
											]}
											numberOfLines={1}>
											{tag}
										</Text>
									</View>
								))}
								{hasMoreTags && (
									<View
										style={[
											styles.listItemTagChip,
											{
												backgroundColor: lightenColor(
													organization?.primaryColor,
													30,
													0.2,
												),
											},
										]}>
										<Text
											style={[
												styles.listItemTagText,
												{
													color: lightenColor(
														organization?.primaryColor,
													),
												},
											]}>
											+{fileTags.length - 3}
										</Text>
									</View>
								)}
							</View>
						)}
					</View>
				</View>
				<Icon
					name='chevron-right'
					size={24}
					color={colors.textSecondary}
				/>
			</TouchableOpacity>
		);
	};

	// Filter files and folders based on search query and tags
	const filteredResults = useMemo(() => {
		let filteredFoldersList = folders;
		let filteredFilesList = files;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filteredFoldersList = folders.filter((folder) =>
				folder.name?.toLowerCase().includes(query),
			);
			filteredFilesList = files.filter((file) =>
				file.name?.toLowerCase().includes(query),
			);
		}

		// Apply tag filter
		if (selectedTags.length > 0) {
			filteredFilesList = filteredFilesList.filter((file) => {
				const fileTags = file.tags || [];
				const fileTagNames = fileTags.map((tag) =>
					typeof tag === 'string' ? tag.trim() : tag?.name?.trim(),
				);
				return selectedTags.some((selectedTag) =>
					fileTagNames.includes(selectedTag),
				);
			});
		}

		return {
			folders: filteredFoldersList,
			files: filteredFilesList,
		};
	}, [folders, files, searchQuery, selectedTags]);

	// Handle tag selection
	const toggleTag = (tag) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	// Early return check must be AFTER all hooks
	if (!organization) {
		return (
			<Background
				primaryColor={organization?.primaryColor}
				secondaryColor={organization?.secondaryColor}>
				<View style={styles.loaderContainer}>
					<Text style={{ color: colors.text }}>
						No organization found
					</Text>
				</View>
			</Background>
		);
	}

	if (loading) {
		return (
			<Background
				primaryColor={organization?.primaryColor}
				secondaryColor={organization?.secondaryColor}>
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
		<Background
			primaryColor={organization?.primaryColor}
			secondaryColor={organization?.secondaryColor}>
			<ScrollView style={styles.container}>
				{/* Top Bar with Back Button, Search, and View Toggle */}
				<View style={styles.topBar}>
					{currentFolderId ? (
						<TouchableOpacity
							onPress={() =>
								navigation.navigate('Media', {
									folderId: undefined,
								})
							}
							style={styles.backButton}>
							<Icon
								name='arrow-left'
								size={24}
								color={
									organization?.secondaryColor || colors.text
								}
							/>
						</TouchableOpacity>
					) : (
						<View style={styles.backButtonPlaceholder} />
					)}

					{/* Search Input */}
					<View style={styles.searchContainer}>
						<View
							style={[
								styles.searchInputInner,
								{
									borderColor: lightenColor(
										organization?.primaryColor,
									),
									backgroundColor:
										colorMode === 'dark'
											? 'rgba(255, 255, 255, 0.1)'
											: 'rgba(255, 255, 255, 0.9)',
								},
							]}>
							<View style={styles.searchIconWrapper}>
								<Icon
									name='magnify'
									size={20}
									color={organization?.primaryColor}
								/>
							</View>
							<TextInput
								value={searchQuery}
								onChangeText={setSearchQuery}
								placeholder='Search folders and files...'
								placeholderTextColor={colors.textSecondary}
								style={[
									styles.searchInput,
									{
										fontFamily: typography.body.fontFamily,
										fontSize: typography.body.fontSize,
										color: colors.text,
									},
								]}
							/>
						</View>
					</View>
				</View>

				{/* Tags Filter */}
				{availableTags.length > 0 && (
					<View style={styles.tagsSection}>
						<Text
							style={[
								styles.sectionTitle,
								{
									color: lightenColor(
										organization?.primaryColor,
									),
									marginBottom: 10,
								},
							]}>
							Filter by Tags
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.tagsContainer}>
							{availableTags.map((tag) => (
								<TouchableOpacity
									key={tag}
									style={[
										styles.tagChip,
										selectedTags.includes(tag) && {
											backgroundColor:
												organization?.primaryColor,
										},
										!selectedTags.includes(tag) && {
											backgroundColor:
												colorMode === 'dark'
													? 'rgba(255, 255, 255, 0.1)'
													: 'rgba(0, 0, 0, 0.05)',
										},
									]}
									onPress={() => toggleTag(tag)}>
									<Text
										style={[
											styles.tagText,
											{
												color: selectedTags.includes(
													tag,
												)
													? '#ffffff'
													: colors.text,
											},
										]}>
										{tag}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				)}

				{/* Folders Section */}
				{filteredResults.folders.length > 0 && (
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text
								style={[
									styles.sectionTitle,
									{
										color: lightenColor(
											organization?.primaryColor,
										),
									},
								]}>
								Folders
							</Text>
							<TouchableOpacity
								style={styles.viewToggleButton}
								onPress={() =>
									setViewMode(
										viewMode === 'grid' ? 'list' : 'grid',
									)
								}>
								<Icon
									name={
										viewMode === 'grid'
											? 'view-list'
											: 'view-grid'
									}
									size={24}
									color={
										organization?.secondaryColor ||
										colors.text
									}
								/>
							</TouchableOpacity>
						</View>
						{viewMode === 'grid' ? (
							<View style={styles.folderGrid}>
								{filteredResults.folders.map((folder) => (
									<FolderCard
										key={folder.id}
										folder={folder}
									/>
								))}
							</View>
						) : (
							<View style={styles.listContainer}>
								{filteredResults.folders.map((folder) => (
									<FolderListItem
										key={folder.id}
										folder={folder}
									/>
								))}
							</View>
						)}
					</View>
				)}

				{/* Files Section */}
				{filteredResults.files.length > 0 && (
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text
								style={[
									styles.sectionTitle,
									{
										color: lightenColor(
											organization?.primaryColor,
										),
									},
								]}>
								Files
							</Text>
							<TouchableOpacity
								style={styles.viewToggleButton}
								onPress={() =>
									setViewMode(
										viewMode === 'grid' ? 'list' : 'grid',
									)
								}>
								<Icon
									name={
										viewMode === 'grid'
											? 'view-list'
											: 'view-grid'
									}
									size={24}
									color={
										organization?.secondaryColor ||
										colors.text
									}
								/>
							</TouchableOpacity>
						</View>
						{viewMode === 'grid' ? (
							<View style={styles.fileGrid}>
								{filteredResults.files.map((file) => (
									<FileCard
										key={file.id}
										file={file}
									/>
								))}
							</View>
						) : (
							<View style={styles.listContainer}>
								{filteredResults.files.map((file) => (
									<FileListItem
										key={file.id}
										file={file}
									/>
								))}
							</View>
						)}
					</View>
				)}

				{/* Empty State */}
				{filteredResults.folders.length === 0 &&
					filteredResults.files.length === 0 && (
						<View style={styles.emptyContainer}>
							<Icon
								name='folder-outline'
								size={64}
								color={colors.textSecondary}
							/>
							<Text
								style={[
									styles.emptyText,
									{ color: colors.textSecondary },
								]}>
								{searchQuery || selectedTags.length > 0
									? 'No results found'
									: 'No folders or files'}
							</Text>
						</View>
					)}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: GRID_SPACING,
		paddingTop: 16,
		paddingBottom: GRID_SPACING,
		gap: 12,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	backButtonPlaceholder: {
		width: 40,
	},
	searchContainer: {
		flex: 1,
	},
	searchInputInner: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 10,
		height: 50,
		borderWidth: 1,
	},
	searchIconWrapper: {
		paddingHorizontal: 10,
	},
	searchInput: {
		flex: 1,
		height: '100%',
	},
	viewToggleButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
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
	listContainer: {
		gap: 8,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 12,
		borderRadius: 8,
		marginBottom: 8,
	},
	listItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	listItemThumbnail: {
		width: 50,
		height: 50,
		borderRadius: 4,
		marginRight: 12,
	},
	listItemIconContainer: {
		width: 50,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	listItemContent: {
		flex: 1,
	},
	listItemName: {
		...typography.body,
		flex: 1,
	},
	listItemTagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 4,
		gap: 4,
	},
	listItemTagChip: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
	},
	listItemTagText: {
		...typography.caption,
		fontSize: 10,
	},
	section: {
		marginBottom: GRID_SPACING * 2,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: GRID_SPACING,
	},
	sectionTitle: {
		...typography.h2,
		fontSize: 20,
		fontWeight: '600',
	},
	tagsSection: {
		marginBottom: 10,
	},
	tagsContainer: {
		flexDirection: 'row',
	},
	tagChip: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
	},
	tagText: {
		...typography.body,
		fontSize: 14,
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
		marginTop: 8,
		textAlign: 'center',
	},
	fileCard: {
		width: ITEM_WIDTH,
		margin: GRID_SPACING / 2,
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
		marginTop: 8,
		textAlign: 'center',
		fontSize: 12,
	},
	fileTagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 4,
		justifyContent: 'center',
		gap: 4,
	},
	fileTagChip: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
	},
	fileTagText: {
		...typography.caption,
		fontSize: 10,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		...typography.body,
		marginTop: 16,
		textAlign: 'center',
	},
});

export default MediaScreen;
