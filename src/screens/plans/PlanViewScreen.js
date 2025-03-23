import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Image,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../shared/styles/typography';
import Background from '../../../shared/components/Background';
import { mediaApi } from '../../../api/mediaRoutes';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar } from '@rneui/themed';
import { teamsApi } from '../../../api/teamRoutes';

const MediaPreview = ({ media, onPress }) => {
	const getMediaIcon = (fileType) => {
		if (fileType.startsWith('image/')) return 'image';
		if (fileType.startsWith('video/')) return 'videocam';
		if (fileType.startsWith('audio/')) return 'audiotrack';
		if (fileType.includes('pdf')) return 'picture-as-pdf';
		return 'insert-drive-file';
	};

	const isImage = (fileType) => {
		return fileType.startsWith('image/');
	};

	const getMediaPreview = (media) => {
		// For PNG files specifically
		if (media.fileType === 'image/png') {
			return (
				<Image
					source={{ uri: media.fileUrl }}
					style={styles.mediaThumbnail}
					resizeMode='cover'
					defaultSource={require('../../../assets/Assemblie_Icon.png')}
					onError={(error) =>
						console.log('PNG loading error:', error)
					}
				/>
			);
		}

		// If there's a thumbnail URL, use it for non-PNG images
		if (media.thumbnailUrl) {
			return (
				<Image
					source={{ uri: media.thumbnailUrl }}
					style={styles.mediaThumbnail}
					resizeMode='cover'
					defaultSource={require('../../../assets/Assemblie_Icon.png')}
				/>
			);
		}

		// If no thumbnail but it's an image (not PNG), use fileUrl
		if (isImage(media.fileType)) {
			return (
				<Image
					source={{ uri: media.fileUrl }}
					style={styles.mediaThumbnail}
					resizeMode='cover'
					defaultSource={require('../../../assets/Assemblie_Icon.png')}
				/>
			);
		}

		// For videos, PDFs, and other files, show an icon
		return (
			<View
				style={[
					styles.mediaThumbnail,
					{
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(255, 255, 255, 0.1)',
					},
				]}>
				<MaterialIcons
					name={getMediaIcon(media.fileType)}
					size={40}
					color='white'
				/>
			</View>
		);
	};

	return (
		<TouchableOpacity
			style={styles.mediaPreview}
			onPress={() => onPress(media)}>
			{getMediaPreview(media)}
			<Text
				style={styles.mediaName}
				numberOfLines={1}>
				{media.name}
			</Text>
		</TouchableOpacity>
	);
};

const PlanViewScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { planId } = route.params;
	const { colors } = useTheme();
	const [collapsedSections, setCollapsedSections] = useState(new Set());
	const [planData, setPlanData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchPlanDetails();
	}, [planId]);

	const fetchPlanDetails = async () => {
		try {
			setLoading(true);
			const response = await teamsApi.getPlan(planId);
			console.log('response for 1 plan', response.plan.sections);
			setPlanData(response.plan);
		} catch (error) {
			console.error('Error fetching plan details:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity
					onPress={() => {
						if (navigation.canGoBack()) {
							navigation.goBack();
						} else {
							navigation.navigate('Teams');
						}
					}}
					style={{ marginLeft: 16 }}>
					<MaterialIcons
						name='arrow-back'
						size={24}
						color='white'
					/>
				</TouchableOpacity>
			),
			title: '',
			headerShown: true,
			headerTransparent: true,
		});
	}, [navigation, planId]);

	// Helper function to add transparency to a color
	const addAlpha = (color, opacity) => {
		// If color is already in rgba format
		if (color.startsWith('rgba')) {
			return color.replace(/[^,]+(?=\))/, opacity);
		}
		// If color is in hex format
		if (color.startsWith('#')) {
			const r = parseInt(color.slice(1, 3), 16);
			const g = parseInt(color.slice(3, 5), 16);
			const b = parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		return color;
	};

	// Calculate derived colors
	const sectionBackground = addAlpha(
		planData?.team?.secondaryColor || colors.secondary,
		0.2
	);
	const blockBackground = addAlpha(
		planData?.team?.primaryColor || colors.primary,
		0.2
	);
	const textColor = colors.textWhite;
	const secondaryTextColor = addAlpha(colors.textWhite, 0.7);

	const toggleSection = (sectionId) => {
		setCollapsedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	};

	// Update the media press handler to use navigate instead of push
	const handleMediaPress = (media) => {
		navigation.navigate('FileView', {
			fileId: media.id,
		});
	};

	const renderBlock = (block) => {
		console.log('block', block);
		return (
			<View key={block.id}>
				<View
					style={[
						styles.blockContainer,
						{ backgroundColor: blockBackground },
					]}>
					<View style={styles.blockHeader}>
						<View style={styles.blockTitleRow}>
							<Text
								style={[
									styles.blockTitle,
									{ color: textColor },
								]}>
								{block.type === 'worship'
									? block.songName
									: block.title || 'Untitled Block'}
							</Text>
							<Text
								style={[
									styles.blockType,
									{ color: secondaryTextColor },
								]}>
								{block.type.charAt(0).toUpperCase() +
									block.type.slice(1)}
							</Text>
						</View>
						{block.type === 'worship' && block.songKey && (
							<Text
								style={[
									styles.songKey,
									{ color: secondaryTextColor },
								]}>
								Key: {block.songKey}
							</Text>
						)}
					</View>

					{(block.content || block.notes) && (
						<View style={styles.blockContent}>
							{block.content && (
								<Text
									style={[
										styles.content,
										{ color: textColor },
									]}>
									{block.content}
								</Text>
							)}
							{block.notes && (
								<Text
									style={[
										styles.notes,
										{ color: secondaryTextColor },
									]}>
									Notes: {block.notes}
								</Text>
							)}
						</View>
					)}

					{/* Media Section */}
					{block.media && block.media.length > 0 && (
						<View style={styles.mediaContainer}>
							<Text
								style={[
									styles.mediaHeader,
									{ color: secondaryTextColor },
								]}>
								Linked Media:
							</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.mediaScroll}>
								{block.media.map((media) => (
									<MediaPreview
										key={media.id}
										media={media}
										onPress={handleMediaPress}
									/>
								))}
							</ScrollView>
						</View>
					)}
				</View>
				<View
					style={[
						styles.blockSeparator,
						{ backgroundColor: addAlpha(colors.textWhite, 0.1) },
					]}
				/>
			</View>
		);
	};

	const renderTeamMember = (memberRole) => {
		const { user, teamRole, notes } = memberRole;

		console.log('memberRole', memberRole);
		return (
			<View
				key={memberRole.id}
				style={[
					styles.teamMemberCard,
					{ backgroundColor: blockBackground },
				]}>
				<View style={styles.teamMemberHeader}>
					<View style={styles.teamMemberInfo}>
						<Avatar
							size={40}
							rounded
							source={
								user.userPhoto
									? { uri: user.userPhoto }
									: require('../../../assets/Assemblie_Icon.png')
							}
						/>
						<View style={styles.memberTextContainer}>
							<Text
								style={[
									styles.memberName,
									{ color: textColor },
								]}>
								{`${user.firstName} ${user.lastName}`}
							</Text>
							<Text
								style={[
									styles.memberRole,
									{ color: secondaryTextColor },
								]}>
								{teamRole.name}
							</Text>
						</View>
					</View>
				</View>
				{notes && (
					<Text
						style={[
							styles.memberNotes,
							{ color: secondaryTextColor },
						]}>
						{notes}
					</Text>
				)}
			</View>
		);
	};

	if (loading || !planData) {
		return (
			<Background>
				<View
					style={[
						styles.container,
						{ justifyContent: 'center', alignItems: 'center' },
					]}>
					<Text style={{ color: colors.textWhite }}>Loading...</Text>
				</View>
			</Background>
		);
	}

	return (
		<Background>
			<ScrollView
				style={[
					styles.container,
					{ backgroundColor: colors.background, marginTop: 60 },
				]}>
				<View style={styles.header}>
					<Text style={[styles.title, { color: textColor }]}>
						{planData.mainTitle}
					</Text>
					<Text
						style={[
							styles.description,
							{ color: secondaryTextColor },
						]}>
						{planData.description}
					</Text>
					{planData.estimatedDuration && (
						<Text
							style={[
								styles.duration,
								{ color: secondaryTextColor },
							]}>
							Estimated Duration: {planData.estimatedDuration}{' '}
							minutes
						</Text>
					)}
				</View>

				{/* Team Members Section */}
				{planData.teamMemberRoles &&
					planData.teamMemberRoles.length > 0 && (
						<View style={styles.teamSection}>
							<Text
								style={[
									styles.sectionTitle,
									{ color: textColor },
								]}>
								Team Members
							</Text>
							<View style={styles.teamMembersContainer}>
								{planData.teamMemberRoles.map(renderTeamMember)}
							</View>
						</View>
					)}

				{planData.sections?.map((section) => (
					<View
						key={section.id}
						style={styles.sectionWrapper}>
						<TouchableOpacity
							style={[
								styles.sectionHeader,
								{ backgroundColor: sectionBackground },
							]}
							onPress={() => toggleSection(section.id)}
							activeOpacity={0.7}>
							<View style={styles.sectionHeaderContent}>
								<View style={styles.sectionTitleRow}>
									<Text
										style={[
											styles.sectionTitle,
											{ color: textColor },
										]}>
										{section.title}
									</Text>
									{section.estimatedDuration && (
										<Text
											style={[
												styles.sectionDuration,
												{ color: secondaryTextColor },
											]}>
											{section.estimatedDuration} min
										</Text>
									)}
								</View>
								{section.description && (
									<Text
										style={[
											styles.sectionDescription,
											{ color: secondaryTextColor },
										]}>
										{section.description}
									</Text>
								)}
							</View>
						</TouchableOpacity>

						{!collapsedSections.has(section.id) && (
							<View style={styles.blocksContainer}>
								{section.blocks?.map((block) =>
									renderBlock(block)
								)}
							</View>
						)}
					</View>
				))}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		padding: 16,
	},
	title: {
		...typography.h4,
		marginBottom: 8,
	},
	description: {
		...typography.bodyMedium,
		marginBottom: 8,
	},
	duration: {
		...typography.bodySmall,
	},
	sectionWrapper: {
		// Remove horizontal margins
	},
	sectionHeader: {
		// Remove border radius and margin
	},
	sectionHeaderContent: {
		padding: 16,
	},
	sectionTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sectionTitle: {
		...typography.h5,
		flex: 1,
	},
	sectionDuration: {
		...typography.bodySmall,
		marginLeft: 8,
	},
	sectionDescription: {
		...typography.bodyMedium,
		marginTop: 4,
	},
	blocksContainer: {
		// Remove all padding
	},
	blockContainer: {
		padding: 12,
	},
	blockHeader: {
		marginBottom: (block) => (block.content || block.notes ? 8 : 0),
	},
	blockTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	blockTitle: {
		...typography.bodyLarge,
		fontWeight: 'bold',
		flex: 1,
		marginRight: 8,
	},
	blockType: {
		...typography.bodySmall,
	},
	songKey: {
		...typography.bodySmall,
		marginTop: 4,
	},
	blockContent: {
		marginTop: 8,
	},
	content: {
		...typography.bodyMedium,
		marginBottom: 8,
	},
	notes: {
		...typography.bodySmall,
		fontStyle: 'italic',
	},
	mediaContainer: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	mediaHeader: {
		...typography.bodySmall,
		marginBottom: 8,
	},
	mediaScroll: {
		flexGrow: 0,
	},
	mediaPreview: {
		width: 100,
		marginRight: 12,
		alignItems: 'center',
	},
	mediaThumbnail: {
		width: 80,
		height: 80,
		borderRadius: 8,
		marginBottom: 4,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	mediaName: {
		...typography.bodySmall,
		color: 'white',
		textAlign: 'center',
		width: '100%',
	},
	teamSection: {
		padding: 16,
		marginBottom: 16,
	},
	teamMembersContainer: {
		marginTop: 8,
	},
	teamMemberCard: {
		marginBottom: 8,
		padding: 12,
		borderRadius: 8,
	},
	teamMemberHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	teamMemberInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	memberTextContainer: {
		marginLeft: 12,
		flex: 1,
	},
	memberName: {
		...typography.bodyLarge,
		fontWeight: 'bold',
	},
	memberRole: {
		...typography.bodyMedium,
		marginTop: 2,
	},
	memberNotes: {
		...typography.bodySmall,
		marginTop: 8,
		fontStyle: 'italic',
	},
	blockSeparator: {
		height: 1,
		marginVertical: 8,
	},
});

export default PlanViewScreen;
