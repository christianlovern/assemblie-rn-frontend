import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Switch,
	Dimensions,
	PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../shared/styles/typography';
import Background from '../../../shared/components/Background';
import { mediaApi } from '../../../api/mediaRoutes';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar } from '@rneui/themed';
import { teamsApi } from '../../../api/teamRoutes';
import { schedulesApi } from '../../../api/schedulesRoutes';
import DeclineScheduleModal from '../../../shared/components/DeclineScheduleModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAR_CUBE_MIN = 80;
const CAR_CUBE_SIZE = Math.max(
	CAR_CUBE_MIN,
	Math.floor((SCREEN_WIDTH - 48) / 2) - 12,
);

const getMediaIcon = (fileType) => {
	const type = (fileType || '').toLowerCase();
	if (type.startsWith('image/')) return 'image';
	if (type.startsWith('video/')) return 'videocam';
	if (type.startsWith('audio/') || type === 'mp3' || type === 'm4a')
		return 'audiotrack';
	if (type.includes('pdf')) return 'picture-as-pdf';
	return 'insert-drive-file';
};

const isAudioMedia = (media) => {
	const type = (media?.fileType || '').toLowerCase();
	return (
		type.startsWith('audio/') ||
		type === 'mp3' ||
		type === 'm4a' ||
		type === 'audio'
	);
};

const getWorshipBlocks = (planData) => {
	if (!planData?.sections) return [];
	return planData.sections
		.flatMap((s) => s.blocks || [])
		.filter((b) => (b.type || '').toLowerCase() === 'worship');
};

const getBlockTitle = (block) => {
	if ((block?.type || '').toLowerCase() === 'worship')
		return block.songName || 'Untitled Song';
	return block.title || 'Untitled Block';
};

const MediaListItem = ({ media, onPress, textColor }) => (
	<TouchableOpacity
		style={styles.mediaListItem}
		onPress={() => onPress(media)}
		activeOpacity={0.7}
		accessible={true}
		accessibilityRole='button'
		accessibilityLabel={`Open ${media.name}`}>
		<View style={styles.mediaListIconWrap}>
			<MaterialIcons
				name={getMediaIcon(media.fileType)}
				size={24}
				color={textColor || 'white'}
			/>
		</View>
		<Text
			style={[styles.mediaListName, { color: textColor || 'white' }]}
			numberOfLines={2}>
			{media.name}
		</Text>
		<MaterialIcons
			name='chevron-right'
			size={22}
			color={textColor || 'white'}
			style={styles.mediaListChevron}
		/>
	</TouchableOpacity>
);

const PlanViewScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { planId, scheduleRequest } = route.params || {};
	const { colors } = useTheme();
	const [collapsedSections, setCollapsedSections] = useState(new Set());
	const [collapsedBlocks, setCollapsedBlocks] = useState(new Set());
	const [planData, setPlanData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isTeamCollapsed, setIsTeamCollapsed] = useState(true);
	const [declineModalVisible, setDeclineModalVisible] = useState(false);
	const [selectedSchedule, setSelectedSchedule] = useState(null);
	const [carMode, setCarMode] = useState(false);
	const [selectedWorshipBlock, setSelectedWorshipBlock] = useState(null);

	const isPendingRequest =
		scheduleRequest && scheduleRequest.status === 'pending';

	const worshipBlocks = useMemo(() => getWorshipBlocks(planData), [planData]);
	const selectedBlockAudio = useMemo(() => {
		if (!selectedWorshipBlock?.media) return [];
		return selectedWorshipBlock.media.filter(isAudioMedia);
	}, [selectedWorshipBlock]);

	useEffect(() => {
		fetchPlanDetails();
	}, [planId]);

	const fetchPlanDetails = async () => {
		try {
			setLoading(true);
			const response = await teamsApi.getPlan(planId);
			console.log('response for 1 plan', response.plan.teamMembers);
			setPlanData(response.plan);
		} catch (error) {
			console.error('Error fetching plan details:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleAccept = async () => {
		if (!scheduleRequest?.id) return;
		try {
			await schedulesApi.accept(scheduleRequest.id);
			Alert.alert('Success', 'Schedule request accepted', [
				{ text: 'OK', onPress: () => navigation.goBack() },
			]);
		} catch (error) {
			console.error('Error accepting schedule:', error);
			Alert.alert(
				'Error',
				'Failed to accept schedule. Please try again.',
			);
		}
	};

	const handleDecline = () => {
		setSelectedSchedule(scheduleRequest);
		setDeclineModalVisible(true);
	};

	const handleDeclineConfirm = async (declineReason) => {
		if (!selectedSchedule?.id) return;
		try {
			await schedulesApi.decline(selectedSchedule.id, declineReason);
			Alert.alert('Success', 'Schedule request declined', [
				{ text: 'OK', onPress: () => navigation.goBack() },
			]);
			setDeclineModalVisible(false);
			setSelectedSchedule(null);
		} catch (error) {
			console.error('Error declining schedule:', error);
			Alert.alert(
				'Error',
				'Failed to decline schedule. Please try again.',
			);
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
	// Block content uses light text on block background so it's readable in any app theme
	const blockContentTextColor = colors.textWhite;

	const looksLikeHtml = (str) =>
		typeof str === 'string' &&
		str.trim().length > 0 &&
		/<[a-z][\s\S]*>/i.test(str);

	const getWrappedHtmlForBlock = (htmlContent, bgColor, fgColor) => {
		const safeBg = bgColor || '#2f3131';
		const safeFg = fgColor || '#FFFFFF';
		return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; background: ${safeBg}; color: ${safeFg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.5; }
    body * { color: ${safeFg} !important; }
    a { color: ${safeFg} !important; text-decoration: underline; }
    p, li, div, span, h1, h2, h3, h4 { color: ${safeFg} !important; }
  </style>
</head>
<body><div>${htmlContent}</div></body>
</html>`;
	};

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

	const currentSongIndex =
		selectedWorshipBlock && worshipBlocks.length > 0
			? worshipBlocks.findIndex((b) => b.id === selectedWorshipBlock.id)
			: -1;
	const canGoNextSong =
		currentSongIndex >= 0 && currentSongIndex < worshipBlocks.length - 1;
	const canGoPrevSong = currentSongIndex > 0;

	const goToNextSong = () => {
		if (!canGoNextSong) return;
		setSelectedWorshipBlock(worshipBlocks[currentSongIndex + 1]);
	};

	const goToPrevSong = () => {
		if (!canGoPrevSong) return;
		setSelectedWorshipBlock(worshipBlocks[currentSongIndex - 1]);
	};

	const carModePanResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 40,
				onPanResponderRelease: (_, g) => {
					if (g.dx > 60) {
						// Swipe right = previous song
						if (canGoPrevSong)
							setSelectedWorshipBlock(
								worshipBlocks[currentSongIndex - 1],
							);
					} else if (g.dx < -60) {
						// Swipe left = next song
						if (canGoNextSong)
							setSelectedWorshipBlock(
								worshipBlocks[currentSongIndex + 1],
							);
					}
				},
			}),
		[worshipBlocks, currentSongIndex, canGoNextSong, canGoPrevSong],
	);

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
									{block.content &&
										(looksLikeHtml(block.content) ? (
											<View
												style={styles.blockHtmlWrapper}>
												<WebView
													originWhitelist={['*']}
													scrollEnabled={false}
													source={{
														html: getWrappedHtmlForBlock(
															block.content,
															blockBackground,
															blockContentTextColor,
														),
													}}
													style={[
														styles.blockWebView,
														{
															backgroundColor:
																blockBackground,
														},
													]}
												/>
											</View>
										) : (
											<Text
												style={[
													styles.content,
													{
														color: blockContentTextColor,
													},
												]}>
												{block.content}
											</Text>
										))}
									{block.notes && (
										<Text
											style={[
												styles.notes,
												{
													color: blockContentTextColor,
												},
											]}>
											Notes: {block.notes}
										</Text>
									)}
								</View>
							)}

							{/* Media Section - vertical list: icon + name per row */}
							{block.media && block.media.length > 0 && (
								<View style={styles.mediaContainer}>
									<Text
										style={[
											styles.mediaHeader,
											{ color: colors.textWhite },
										]}>
										Linked Media:
									</Text>
									<View style={styles.mediaList}>
										{block.media.map((media) => (
											<MediaListItem
												key={media.id}
												media={media}
												onPress={handleMediaPress}
												textColor={colors.textWhite}
											/>
										))}
									</View>
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

	const rawTeamMembers =
		planData?.teamMembers ??
		planData?.teammembers ??
		planData?.teamMemberRoles ??
		[];
	// Normalize: teamMemberRoles uses teamRole, teamMembers uses role. Show all members; sort approved first.
	const teamMembersList = rawTeamMembers
		.map((m) => ({
			...m,
			role: m.role || m.teamRole,
			user: m.user,
		}))
		.filter((m) => m?.user)
		.sort((a, b) => {
			const aApproved = a?.scheduleStatus === 'approved' ? 0 : 1;
			const bApproved = b?.scheduleStatus === 'approved' ? 0 : 1;
			return aApproved - bApproved;
		});

	const renderTeamMember = (member, index = 0) => {
		const { user, role } = member;
		if (!user) return null;
		const isPending = member?.scheduleStatus !== 'approved';

		return (
			<View
				key={member?.id ?? user?.id ?? index}
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
								{`${user.firstName || ''} ${user.lastName || ''}`.trim()}
							</Text>
							{role?.name ? (
								<Text
									style={[
										styles.memberRole,
										{ color: colors.textWhite },
									]}>
									{role.name}
								</Text>
							) : null}
							{isPending && (
								<Text
									style={[
										styles.memberScheduleStatus,
										{ color: colors.textWhite },
									]}>
									Pending
								</Text>
							)}
						</View>
					</View>
				</View>
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

	const renderCarModeContent = () => {
		const cubeStyle = [
			styles.carCube,
			{
				backgroundColor: blockBackground,
				minWidth: CAR_CUBE_SIZE,
				minHeight: CAR_CUBE_SIZE,
			},
		];
		const cubeTextStyle = [styles.carCubeText, { color: colors.textWhite }];

		if (selectedWorshipBlock) {
			const audioList = selectedBlockAudio;
			return (
				<View style={styles.carModeInner}>
					<View style={styles.carModeBar}>
						<TouchableOpacity
							style={[
								styles.carModeButton,
								{ backgroundColor: blockBackground },
							]}
							onPress={() => setSelectedWorshipBlock(null)}
							activeOpacity={0.8}
							accessibilityLabel='Back to songs'>
							<MaterialIcons
								name='arrow-back'
								size={28}
								color={colors.textWhite}
							/>
							<Text
								style={[
									styles.carModeButtonText,
									{ color: colors.textWhite },
								]}>
								Back
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.carModeButton,
								{
									backgroundColor: blockBackground,
									opacity: canGoNextSong ? 1 : 0.5,
								},
							]}
							onPress={goToNextSong}
							activeOpacity={0.8}
							disabled={!canGoNextSong}
							accessibilityLabel='Next song'>
							<Text
								style={[
									styles.carModeButtonText,
									{ color: colors.textWhite },
								]}>
								Next
							</Text>
							<MaterialIcons
								name='arrow-forward'
								size={28}
								color={colors.textWhite}
							/>
						</TouchableOpacity>
					</View>
					<ScrollView
						style={styles.carModeScroll}
						contentContainerStyle={styles.carModeGrid}
						showsVerticalScrollIndicator={false}>
						{audioList.length === 0 ? (
							<Text
								style={[
									styles.carModeEmpty,
									{ color: textColor },
								]}>
								No audio files for this song
							</Text>
						) : (
							audioList.map((media) => (
								<TouchableOpacity
									key={media.id}
									style={cubeStyle}
									onPress={() => handleMediaPress(media)}
									activeOpacity={0.8}
									accessibilityLabel={`Play ${media.name}`}>
									<MaterialIcons
										name='audiotrack'
										size={40}
										color={colors.textWhite}
									/>
									<Text
										style={cubeTextStyle}
										numberOfLines={2}>
										{media.name}
									</Text>
								</TouchableOpacity>
							))
						)}
					</ScrollView>
				</View>
			);
		}

		return (
			<View style={styles.carModeInner}>
				<Text style={[styles.carModeScreenTitle, { color: textColor }]}>
					Worship
				</Text>
				<ScrollView
					style={styles.carModeScroll}
					contentContainerStyle={styles.carModeGrid}
					showsVerticalScrollIndicator={false}>
					{worshipBlocks.length === 0 ? (
						<Text
							style={[styles.carModeEmpty, { color: textColor }]}>
							No worship songs in this plan
						</Text>
					) : (
						worshipBlocks.map((block) => (
							<TouchableOpacity
								key={block.id}
								style={cubeStyle}
								onPress={() => setSelectedWorshipBlock(block)}
								activeOpacity={0.8}
								accessibilityLabel={`Open ${getBlockTitle(block)}`}>
								<Text
									style={cubeTextStyle}
									numberOfLines={3}>
									{getBlockTitle(block)}
								</Text>
							</TouchableOpacity>
						))
					)}
				</ScrollView>
			</View>
		);
	};

	return (
		<Background>
			{carMode ? (
				<View
					style={[
						styles.carModeContainer,
						{ backgroundColor: colors.background },
					]}
					{...carModePanResponder.panHandlers}>
					<View style={styles.carModeHeaderRow}>
						<Text
							style={[
								styles.carModeHeaderTitle,
								{ color: textColor },
							]}
							numberOfLines={selectedWorshipBlock ? 2 : 1}>
							{selectedWorshipBlock
								? getBlockTitle(selectedWorshipBlock)
								: planData.mainTitle}
						</Text>
						<View style={styles.carModeToggleWrap}>
							<Text
								style={[
									styles.carModeLabel,
									{ color: textColor },
								]}
								numberOfLines={1}>
								Car Mode
							</Text>
							<Switch
								value={carMode}
								onValueChange={(value) => {
									setCarMode(value);
									if (!value) setSelectedWorshipBlock(null);
								}}
								trackColor={{
									false: colors.primary,
									true: blockBackground,
								}}
								thumbColor={colors.textWhite}
								accessibilityLabel='Toggle Car Mode'
							/>
						</View>
					</View>
					{renderCarModeContent()}
				</View>
			) : (
				<ScrollView
					style={[
						styles.container,
						{ backgroundColor: colors.background },
					]}>
					<View style={styles.header}>
						<View style={styles.headerTitleRow}>
							<Text
								style={[styles.title, { color: textColor }]}
								numberOfLines={2}>
								{planData.mainTitle}
							</Text>
							<View style={styles.carModeToggleWrap}>
								<Text
									style={[
										styles.carModeLabel,
										{ color: textColor },
									]}
									numberOfLines={1}>
									Car Mode
								</Text>
								<Switch
									value={carMode}
									onValueChange={(value) => {
										setCarMode(value);
										if (!value)
											setSelectedWorshipBlock(null);
									}}
									trackColor={{
										false: colors.primary,
										true: blockBackground,
									}}
									thumbColor={colors.textWhite}
									accessibilityLabel='Toggle Car Mode'
								/>
							</View>
						</View>
						<Text
							style={[
								styles.description,
								{ color: secondaryTextColor },
							]}>
							{planData.description}
						</Text>
						{planData.estimatedDuration != null &&
							planData.estimatedDuration !== '' &&
							planData.estimatedDuration !== 0 && (
								<Text
									style={[
										styles.duration,
										{ color: secondaryTextColor },
									]}>
									Estimated Duration:{' '}
									{planData.estimatedDuration} minutes
								</Text>
							)}
					</View>

					{/* Schedule request actions: Accept / Decline when viewing from a pending request */}
					{isPendingRequest && (
						<View style={styles.scheduleActionsBar}>
							<Text
								style={[
									styles.scheduleActionsLabel,
									{ color: colors.text },
								]}
								numberOfLines={1}>
								You have a pending request for this plan
							</Text>
							<View style={styles.scheduleActionButtons}>
								<TouchableOpacity
									style={[
										styles.scheduleActionButton,
										styles.acceptButton,
									]}
									onPress={handleAccept}
									activeOpacity={0.8}>
									<Text
										style={styles.scheduleActionButtonText}>
										Accept
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.scheduleActionButton,
										styles.declineButton,
									]}
									onPress={handleDecline}
									activeOpacity={0.8}>
									<Text
										style={styles.scheduleActionButtonText}>
										Decline
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					)}

					{/* Team Members Section */}
					{teamMembersList.length > 0 && (
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
									Team Members ({teamMembersList.length})
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
									{teamMembersList.map((member, index) => (
										<Avatar
											key={`avatar-${member?.user?.id ?? index}`}
											size={32}
											rounded
											source={
												member.user?.userPhoto
													? {
															uri: member.user
																.userPhoto,
														}
													: require('../../../assets/Assemblie_DefaultUserIcon.png')
											}
											containerStyle={
												styles.collapsedAvatar
											}
										/>
									))}
								</View>
							) : (
								/* Expanded View: Full Member Cards */
								<View style={styles.teamMembersContainer}>
									{teamMembersList.map((member, idx) =>
										renderTeamMember(member, idx),
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
														{
															color: colors.textWhite,
														},
													]}>
													{section.title}
												</Text>
												{section.blocks &&
													section.blocks.length >
														0 && (
														<Text
															style={[
																styles.blockCount,
																{
																	color: colors.textWhite,
																},
															]}>
															(
															{
																section.blocks
																	.length
															}{' '}
															{section.blocks
																.length === 1
																? 'block'
																: 'blocks'}
															)
														</Text>
													)}
											</View>
											{section.estimatedDuration !=
												null &&
												section.estimatedDuration !==
													'' &&
												section.estimatedDuration !==
													0 && (
													<Text
														style={[
															styles.sectionDuration,
															{
																color: colors.textWhite,
															},
														]}>
														{
															section.estimatedDuration
														}{' '}
														min
													</Text>
												)}
										</View>
										{!isSectionCollapsed &&
											section.description != null &&
											section.description !== '' && (
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
			)}

			<DeclineScheduleModal
				visible={declineModalVisible}
				onClose={() => {
					setDeclineModalVisible(false);
					setSelectedSchedule(null);
				}}
				onConfirm={handleDeclineConfirm}
				schedule={selectedSchedule}
			/>
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
	headerTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
		gap: 12,
	},
	carModeToggleWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minWidth: 80,
		justifyContent: 'flex-end',
	},
	carModeLabel: {
		...typography.bodySmall,
		fontSize: 14,
	},
	carModeContainer: {
		flex: 1,
		padding: 16,
	},
	carModeHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
		gap: 12,
	},
	carModeHeaderTitle: {
		...typography.h2,
		flex: 1,
	},
	carModeInner: {
		flex: 1,
	},
	carModeBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
		minHeight: CAR_CUBE_MIN,
	},
	carModeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 12,
		minWidth: CAR_CUBE_MIN,
		minHeight: CAR_CUBE_MIN,
		gap: 8,
	},
	carModeButtonText: {
		...typography.bodyLarge,
		fontSize: 18,
		fontWeight: '600',
	},
	carModeButtonPlaceholder: {
		minWidth: CAR_CUBE_MIN,
		minHeight: CAR_CUBE_MIN,
	},
	carModeTitle: {
		...typography.bodyLarge,
		fontSize: 18,
		flex: 1,
		textAlign: 'center',
		marginHorizontal: 8,
	},
	carModeScreenTitle: {
		...typography.h2,
		textAlign: 'center',
		marginBottom: 20,
	},
	carModeScroll: {
		flex: 1,
	},
	carModeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 16,
		paddingBottom: 40,
	},
	carCube: {
		width: CAR_CUBE_SIZE,
		height: CAR_CUBE_SIZE,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 12,
	},
	carCubeText: {
		...typography.bodyLarge,
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: 8,
	},
	carModeEmpty: {
		...typography.body,
		textAlign: 'center',
		marginTop: 24,
	},
	scheduleActionsBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginHorizontal: 0,
		marginBottom: 8,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		flexWrap: 'wrap',
		gap: 8,
	},
	scheduleActionsLabel: {
		...typography.body,
		fontSize: 14,
		flex: 1,
		minWidth: 140,
	},
	scheduleActionButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	scheduleActionButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
	acceptButton: {
		backgroundColor: '#52c41a',
	},
	declineButton: {
		backgroundColor: '#ff4d4f',
	},
	scheduleActionButtonText: {
		...typography.caption,
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
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
	blockHtmlWrapper: {
		minHeight: 120,
		height: 220,
		width: '100%',
		borderRadius: 8,
		overflow: 'hidden',
		marginBottom: 8,
	},
	blockWebView: {
		flex: 1,
		borderRadius: 8,
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
		width: '100%',
		alignSelf: 'stretch',
	},
	mediaHeader: {
		...typography.bodySmall,
		marginBottom: 8,
		textAlign: 'left',
	},
	mediaList: {
		gap: 4,
		width: '100%',
		alignSelf: 'stretch',
	},
	mediaListItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 10,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		minHeight: 48,
		width: '100%',
		alignSelf: 'stretch',
	},
	mediaListIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.12)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	mediaListName: {
		...typography.bodyMedium,
		flex: 1,
		textAlign: 'left',
	},
	mediaListChevron: {
		opacity: 0.8,
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
	memberScheduleStatus: {
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
