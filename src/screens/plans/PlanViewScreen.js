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
					defaultSource={require('../../../assets/Icon_Primary.png')}
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
					defaultSource={require('../../../assets/Icon_Primary.png')}
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
					defaultSource={require('../../../assets/Icon_Primary.png')}
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
	const [collapsedBlocks, setCollapsedBlocks] = useState(new Set());
	const [planData, setPlanData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isTeamCollapsed, setIsTeamCollapsed] = useState(false);

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
			headerShown: false,
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
	const sectionBackground =
		planData?.team?.secondaryColor || colors.secondary;
	const blockBackground = planData?.team?.primaryColor || colors.primary;
	const textColor = colors.text;
	const secondaryTextColor = colors.text;

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

	const toggleBlock = (blockId) => {
		setCollapsedBlocks((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(blockId)) {
				newSet.delete(blockId);
			} else {
				newSet.add(blockId);
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

	const getBlockTitle = (block) => {
		console.log('block', block.type);
		if (block.type === 'worship') {
			console.log('block.songName', block.songName);
			return block.songName || 'Untitled Song';
		}
		return block.title || 'Untitled Block';
	};
	const renderBlock = (block) => {
		const isBlockCollapsed = collapsedBlocks.has(block.id);
		return (
			<View key={block.id}>
				<TouchableOpacity
					style={[
						styles.blockContainer,
						{
							backgroundColor: blockBackground,
							padding: 12,
						},
					]}
					onPress={() => toggleBlock(block.id)}
					activeOpacity={0.7}>
					<View style={styles.blockHeader}>
						<View style={styles.blockTitleRow}>
							<Text
								style={[
									styles.blockTitle,
									{ color: colors.textWhite },
								]}>
								{getBlockTitle(block) || 'Untitled Block'}
							</Text>
							{block.type === 'worship' && block.songKey && (
								<Text
									style={[
										styles.songKey,
										{
											color: colors.textWhite,
											justifyContent: 'flex-end',
											alignItems: 'flex-end',
											alignSelf: 'flex-end',
										},
									]}>
									Key: {block.songKey}
								</Text>
							)}
						</View>
					</View>

					{/* Expanded Content */}
					{!isBlockCollapsed && (
						<>
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
											{ color: colors.textWhite },
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
						</>
					)}
				</TouchableOpacity>
				<View
					style={[
						styles.blockSeparator,
						{ backgroundColor: colors.primary },
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
									: require('../../../assets/Assemblie_DefaultUserIcon.png')
							}
						/>
						<View style={styles.memberTextContainer}>
							<Text
								style={[
									styles.memberName,
									{ color: colors.textWhite },
								]}>
								{`${user.firstName} ${user.lastName}`}
							</Text>
							<Text
								style={[
									styles.memberRole,
									{ color: colors.textWhite },
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
					<Text style={{ color: colors.text }}>Loading...</Text>
				</View>
			</Background>
		);
	}

	return (
		<Background>
			<ScrollView
				style={[
					styles.container,
					{ backgroundColor: colors.background },
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
							<TouchableOpacity
								style={styles.teamHeaderRow}
								onPress={() =>
									setIsTeamCollapsed(!isTeamCollapsed)
								}
								activeOpacity={0.7}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: colors.text },
									]}>
									Team Members (
									{planData.teamMemberRoles.length})
								</Text>
								<MaterialIcons
									name={
										isTeamCollapsed
											? 'keyboard-arrow-down'
											: 'keyboard-arrow-up'
									}
									size={24}
									color={colors.text}
								/>
							</TouchableOpacity>

							{isTeamCollapsed ? (
								/* Collapsed View: Horizontal Avatar Wrap */
								<View style={styles.avatarWrapRow}>
									{planData.teamMemberRoles.map(
										(role, index) => (
											<Avatar
												key={`avatar-${role.id}`}
												size={32}
												rounded
												source={
													role.user.userPhoto
														? {
																uri: role.user
																	.userPhoto,
															}
														: require('../../../assets/Assemblie_DefaultUserIcon.png')
												}
												containerStyle={
													styles.collapsedAvatar
												}
											/>
										),
									)}
								</View>
							) : (
								/* Expanded View: Full Member Cards */
								<View style={styles.teamMembersContainer}>
									{planData.teamMemberRoles.map(
										renderTeamMember,
									)}
								</View>
							)}
						</View>
					)}

				{planData.sections?.map((section) => {
					const isSectionCollapsed = collapsedSections.has(
						section.id,
					);
					return (
						<View
							key={section.id}
							style={{
								borderWidth: 1,
								borderColor: colors.background,
							}}>
							<TouchableOpacity
								style={[
									styles.sectionHeader,
									{ backgroundColor: sectionBackground },
								]}
								onPress={() => toggleSection(section.id)}
								activeOpacity={0.7}>
								<View style={styles.sectionHeaderContent}>
									<View style={styles.sectionTitleRow}>
										<View
											style={
												styles.sectionTitleContainer
											}>
											<Text
												style={[
													styles.sectionTitle,
													{ color: colors.textWhite },
												]}>
												{section.title}
											</Text>
											{section.blocks &&
												section.blocks.length > 0 && (
													<Text
														style={[
															styles.blockCount,
															{
																color: colors.textWhite,
															},
														]}>
														({section.blocks.length}{' '}
														{section.blocks
															.length === 1
															? 'block'
															: 'blocks'}
														)
													</Text>
												)}
										</View>
										{section.estimatedDuration && (
											<Text
												style={[
													styles.sectionDuration,
													{
														color: colors.textWhite,
													},
												]}>
												{section.estimatedDuration} min
											</Text>
										)}
									</View>
									{!isSectionCollapsed &&
										section.description && (
											<Text
												style={[
													styles.sectionDescription,
													{
														color: colors.textWhite,
													},
												]}>
												{section.description}
											</Text>
										)}
								</View>
							</TouchableOpacity>

							{!isSectionCollapsed && (
								<View
									style={{
										borderWidth: 1,
										borderColor: colors.background,
									}}>
									{section.blocks?.map((block) =>
										renderBlock(block),
									)}
								</View>
							)}
						</View>
					);
				})}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	header: {
		padding: 16,
	},
	title: {
		...typography.h2,
		marginBottom: 8,
	},
	description: {
		...typography.bodyMedium,
		marginBottom: 8,
	},
	duration: {
		...typography.bodySmall,
	},
	sectionWrapper: {},
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
	sectionTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		flexWrap: 'wrap',
	},
	sectionTitle: {
		...typography.bodyLarge,
	},

	sectionDuration: {
		...typography.bodySmall,
		marginLeft: 8,
	},
	sectionDescription: {
		...typography.body,
		marginTop: 4,
	},
	blockContainer: {
		borderWidth: 1,
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
		width: '100%',
	},
	blockTitle: {
		...typography.bodyLarge,
	},
	blockType: {
		...typography.bodySmall,
	},
	songKey: {
		...typography.bodySmall,
		marginTop: 4,
	},
	blockContainer: {
		borderWidth: 1,
		width: '95%',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
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
	avatarWrapRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8,
		paddingHorizontal: 4,
	},
	collapsedAvatar: {
		marginRight: -12,
		marginBottom: 4,
		width: 64,
		height: 64,
		borderRadius: 32,
		borderWidth: 2,
		borderColor: '#FFFFFF',
		overflow: 'hidden',
	},
	teamHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 4,
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
