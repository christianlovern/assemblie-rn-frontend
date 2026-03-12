import React, {
	useEffect,
	useMemo,
	useState,
	useCallback,
	useRef,
} from 'react';
import {
	ScrollView,
	View,
	Text,
	Image,
	ImageBackground,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Alert,
	RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import AnnouncementCard from '../../../shared/components/AnnouncementCard';
import EventCard from '../../../shared/components/EventCard';
import EventDetailDrawer from '../../../shared/components/EventDetailDrawer';
import Background from '../../../shared/components/Background';
import ScheduleCard from '../../../shared/components/ScheduleCard';
import DeclineScheduleModal from '../../../shared/components/DeclineScheduleModal';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { typography } from '../../../shared/styles/typography';
import { mediaApi } from '../../../api/mediaRoutes';
import { schedulesApi } from '../../../api/schedulesRoutes';
import { normalizeDateString } from '../../../shared/helper/normalizers';
import { useChatUnreadRefresh } from '../../contexts/ChatUnreadContext';

const { width } = Dimensions.get('window');

// Component to generate thumbnails for videos and PDFs
const MediaThumbnail = ({
	media,
	isVideo,
	isPDF,
	style,
	objectFit = 'cover',
}) => {
	if (isVideo) {
		// Generate video thumbnail using WebView with first frame
		return (
			<WebView
				source={{
					html: `
						<!DOCTYPE html>
						<html>
							<head>
								<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
								<style>
									* {
										margin: 0;
										padding: 0;
										box-sizing: border-box;
									}
									body, html {
										width: 100%;
										height: 100%;
										overflow: hidden;
										background-color: #000;
									}
									video {
										width: 100%;
										height: 100%;
										object-fit: ${objectFit};
									}
								</style>
							</head>
							<body>
								<video 
									src="${media.fileUrl}" 
									muted
									playsinline
									webkit-playsinline
									preload="metadata"
								></video>
								<script>
									var video = document.querySelector('video');
									var thumbnailTime = 5; // Time in seconds for thumbnail
									video.addEventListener('loadedmetadata', function() {
										if (this.duration >= thumbnailTime) {
											this.currentTime = thumbnailTime;
										} else {
											this.currentTime = this.duration * 0.1; // Use 10% if video is shorter than 5 seconds
										}
									});
									video.addEventListener('seeked', function() {
										this.pause();
									});
									video.addEventListener('canplay', function() {
										this.pause();
									});
								</script>
							</body>
						</html>
					`,
				}}
				style={style}
				scrollEnabled={false}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				javaScriptEnabled={true}
				mediaPlaybackRequiresUserAction={false}
				allowsInlineMediaPlayback={true}
				pointerEvents='none'
			/>
		);
	}

	if (isPDF) {
		// Generate PDF thumbnail using Google Docs viewer (first page)
		const pdfUrl = encodeURIComponent(media.fileUrl);
		return (
			<WebView
				source={{
					uri: `https://docs.google.com/viewer?url=${pdfUrl}&embedded=true&rm=minimal`,
				}}
				style={style}
				scrollEnabled={false}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				javaScriptEnabled={true}
				pointerEvents='none'
			/>
		);
	}

	return null;
};

const HomeScreen = () => {
	const {
		user,
		organization,
		announcements,
		events,
		teams,
		lastDataRefresh,
		refreshOrganizationData,
	} = useData();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const [mediaFiles, setMediaFiles] = useState([]);
	const [mediaLoading, setMediaLoading] = useState(false);
	const [singleMediaAspectRatio, setSingleMediaAspectRatio] = useState(null);
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [drawerItem, setDrawerItem] = useState(null);
	const [drawerType, setDrawerType] = useState(null);
	const [upcomingSchedules, setUpcomingSchedules] = useState([]);
	const [upcomingLoading, setUpcomingLoading] = useState(false);
	const [declineModalVisible, setDeclineModalVisible] = useState(false);
	const [selectedScheduleForDecline, setSelectedScheduleForDecline] =
		useState(null);
	const refreshUnreadCount = useChatUnreadRefresh();
	const [refreshing, setRefreshing] = useState(false);
	const lastPullRefreshAt = useRef(0);
	/** Pull-to-refresh at most once per minute. */
	const REFRESH_COOLDOWN_MS = 60 * 1000;

	// Refresh header chat badge when Home is focused (e.g. returning from TeamChat)
	useFocusEffect(
		useCallback(() => {
			refreshUnreadCount();
		}, [refreshUnreadCount]),
	);

	// When there's exactly one featured item, fetch its aspect ratio so we can respect it (no cropping)
	useEffect(() => {
		if (!mediaFiles?.length || mediaFiles.length !== 1) {
			setSingleMediaAspectRatio(null);
			return;
		}
		const media = mediaFiles[0];
		const isImage = media.fileType
			?.toLowerCase()
			?.match(/^(jpg|jpeg|png|gif|image\/jpeg|image\/png|image\/gif)$/);
		const hasImageUrl =
			isImage && media.fileUrl && media.fileUrl.trim() !== '';
		if (hasImageUrl) {
			Image.getSize(
				media.fileUrl,
				(width, height) => {
					if (height > 0) {
						setSingleMediaAspectRatio(width / height);
					} else {
						setSingleMediaAspectRatio(16 / 9);
					}
				},
				() => setSingleMediaAspectRatio(16 / 9),
			);
		} else {
			// Video/PDF: use landscape as default so sides aren't cut off
			setSingleMediaAspectRatio(16 / 9);
		}
	}, [mediaFiles]);

	// Prepare the data for carousels - fix the data access
	const announcementsData = announcements?.announcements || [];
	const eventsData = events?.events || [];

	// Fetch latest media files
	useEffect(() => {
		const loadMedia = async () => {
			if (!organization?.id) return;

			try {
				setMediaLoading(true);

				const featuredData = await mediaApi.getFeatured(
					organization.id,
				);

				const filteredMedia = (featuredData || []).filter((file) => {
					const fileType = file.fileType?.toLowerCase() || '';
					const fileUrl = file.fileUrl?.toLowerCase() || '';
					return (
						fileType.match(
							/^(jpg|jpeg|png|gif|image\/jpeg|image\/png|image\/gif)$/,
						) ||
						fileType.match(
							/^(mp4|mov|video\/mp4|video\/quicktime)$/,
						) ||
						fileType.match(
							/^(mp3|wav|m4a|audio\/mpeg|audio\/mp3|audio\/wav|audio\/m4a)$/,
						) ||
						fileType === 'pdf' ||
						fileType === 'application/pdf' ||
						fileUrl.endsWith('.pdf')
					);
				});

				setMediaFiles(filteredMedia);
			} catch (error) {
				console.error('Error loading media:', error);
			} finally {
				setMediaLoading(false);
			}
		};

		loadMedia();
	}, [organization?.id, lastDataRefresh]);

	// Upcoming plans: today through next 7 days (only for users who are part of a team)
	const loadUpcomingSchedules = useCallback(async () => {
		if (!teams?.length || !organization?.id) {
			setUpcomingSchedules([]);
			return;
		}
		try {
			setUpcomingLoading(true);
			const today = new Date();
			const endDate = new Date(today);
			endDate.setDate(endDate.getDate() + 7);
			const startStr = today.toISOString().slice(0, 10);
			const endStr = endDate.toISOString().slice(0, 10);
			const response = await schedulesApi.getMySchedules({
				organizationId: organization.id,
				startDate: startStr,
				endDate: endStr,
			});
			const list = response.scheduleRequests || [];
			const todayNorm = normalizeDateString(startStr);
			const endNorm = normalizeDateString(endStr);
			const filtered = list.filter((s) => {
				const d = normalizeDateString(s.scheduledDate);
				return (
					d &&
					d >= todayNorm &&
					d <= endNorm &&
					s.status !== 'declined'
				);
			});
			setUpcomingSchedules(filtered);
		} catch (error) {
			console.error('Error loading upcoming schedules:', error);
			setUpcomingSchedules([]);
		} finally {
			setUpcomingLoading(false);
		}
	}, [teams?.length, organization?.id]);

	useEffect(() => {
		loadUpcomingSchedules();
	}, [loadUpcomingSchedules]);

	const onRefresh = useCallback(async () => {
		if (Date.now() - lastPullRefreshAt.current < REFRESH_COOLDOWN_MS) return;
		lastPullRefreshAt.current = Date.now();
		setRefreshing(true);
		try {
			await refreshOrganizationData();
			refreshUnreadCount();
			await loadUpcomingSchedules();
		} finally {
			setRefreshing(false);
		}
	}, [
		refreshOrganizationData,
		refreshUnreadCount,
		loadUpcomingSchedules,
	]);

	// Get the 2 most recently created announcements
	const recentAnnouncements = useMemo(() => {
		if (!announcementsData || announcementsData.length === 0) {
			return [];
		}

		// Sort by createdAt (most recent first), fallback to displayStartDate
		const sorted = [...announcementsData].sort((a, b) => {
			const dateA = a.createdAt
				? new Date(a.createdAt)
				: new Date(a.displayStartDate || 0);
			const dateB = b.createdAt
				? new Date(b.createdAt)
				: new Date(b.displayStartDate || 0);
			return dateB - dateA; // Most recent first
		});

		return sorted.slice(0, 2);
	}, [announcementsData]);

	// Get the 2 most recently created events
	const recentEvents = useMemo(() => {
		if (!eventsData || eventsData.length === 0) {
			return [];
		}

		// Sort by createdAt (most recent first), fallback to startDate
		const sorted = [...eventsData].sort((a, b) => {
			const dateA = a.createdAt
				? new Date(a.createdAt)
				: new Date(a.startDate || 0);
			const dateB = b.createdAt
				? new Date(b.createdAt)
				: new Date(b.startDate || 0);
			return dateB - dateA; // Most recent first
		});

		return sorted.slice(0, 2);
	}, [eventsData]);

	const handleAnnouncementPress = (announcement) => {
		setDrawerItem({ ...announcement, type: 'announcement' });
		setDrawerType('announcement');
		setDrawerVisible(true);
	};

	const handleEventPress = (event) => {
		setDrawerItem({ ...event, type: 'events' });
		setDrawerType('events');
		setDrawerVisible(true);
	};

	const handleMediaPress = (media) => {
		navigation.navigate('FileView', {
			fileId: media.id,
		});
	};

	const handleSchedulePress = (schedule) => {
		if (schedule.planId) {
			navigation.navigate('PlanView', {
				planId: schedule.planId,
				scheduleRequest: schedule,
			});
		}
	};

	const handleAcceptSchedule = async (schedule) => {
		try {
			await schedulesApi.accept(schedule.id);
			Alert.alert('Success', 'Schedule request accepted');
			loadUpcomingSchedules();
		} catch (error) {
			console.error('Error accepting schedule:', error);
			Alert.alert(
				'Error',
				'Failed to accept schedule. Please try again.',
			);
		}
	};

	const handleDeclineSchedule = (schedule) => {
		setSelectedScheduleForDecline(schedule);
		setDeclineModalVisible(true);
	};

	const handleDeclineConfirm = async (declineReason) => {
		if (!selectedScheduleForDecline?.id) return;
		try {
			await schedulesApi.decline(
				selectedScheduleForDecline.id,
				declineReason,
			);
			Alert.alert('Success', 'Schedule request declined');
			setDeclineModalVisible(false);
			setSelectedScheduleForDecline(null);
			loadUpcomingSchedules();
		} catch (error) {
			console.error('Error declining schedule:', error);
			Alert.alert(
				'Error',
				'Failed to decline schedule. Please try again.',
			);
		}
	};

	// Early return check must be AFTER all hooks
	if (!organization) {
		return <Text>No organization found</Text>;
	}

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<ScrollView
				contentContainerStyle={[
					styles.scrollContainer,
					{ paddingBottom: 20 + Math.max(insets.bottom, 0) },
				]}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				<View style={styles.homeContainer}>
					<ImageBackground
						source={
							organization?.coverImage
								? { uri: organization.coverImage }
								: require('../../../assets/Assemblie_DefaultCover.png')
						}
						style={styles.headerContainer}
						resizeMode='cover'
						opacity={0.8}
						onError={(e) =>
							console.log(
								'Cover Image Error:',
								e.nativeEvent.error,
							)
						}>
						<TouchableOpacity
							style={styles.coverQRButton}
							onPress={() => navigation.navigate('ShareMyChurch')}
							accessibilityLabel='Share my church QR code'
							accessibilityRole='button'>
							<Icon
								name='qr-code'
								size={28}
								color='#FFFFFF'
							/>
						</TouchableOpacity>
						{/* Gradient Overlay */}
						<View style={styles.rowContainer}>
							<Image
								source={
									organization?.orgPicture
										? { uri: organization.orgPicture }
										: require('../../../assets/Assemblie_DefaultChurchIcon.png')
								}
								style={styles.organizationIcon}
								resizeMode='cover'
								onError={(e) =>
									console.log(
										'Org Picture Error:',
										e.nativeEvent.error,
									)
								}
							/>
							<View>
								<Text style={styles.organizationName}>
									{organization.name}
								</Text>
								<Text style={styles.organizationLocation}>
									{organization.city}, {organization.state}
								</Text>
							</View>
						</View>
					</ImageBackground>
					<View style={styles.actionRowContainer}>
						<TouchableOpacity
							style={[
								styles.actionButton,
								{ backgroundColor: organization.primaryColor },
							]}
							onPress={() => navigation.navigate('Give')}
							activeOpacity={0.8}>
							<Icon
								name='favorite'
								size={20}
								color='white'
							/>
							<Text style={styles.actionButtonText}>Give</Text>
						</TouchableOpacity>

						{!user?.isGuest && (
							<TouchableOpacity
								style={[
									styles.actionButton,
									{
										backgroundColor:
											organization.primaryColor,
									},
								]}
								onPress={() => navigation.navigate('CheckIn')}
								activeOpacity={0.8}>
								<Icon
									name='person-add'
									size={20}
									color='white'
								/>
								<Text style={styles.actionButtonText}>
									Check In
								</Text>
							</TouchableOpacity>
						)}
					</View>
					{teams &&
						teams.length > 0 &&
						(upcomingSchedules.length > 0 || upcomingLoading) && (
							<View style={styles.upcomingPlansContainer}>
								<View style={styles.announcementsHeader}>
									<Text
										style={[
											styles.headerText,
											{
												color: lightenColor(
													organization.primaryColor,
												),
											},
										]}>
										Upcoming Plans
									</Text>
									<TouchableOpacity
										onPress={() =>
											navigation.navigate('MySchedules')
										}>
										<Text
											style={[
												styles.viewAllText,
												{
													color: lightenColor(
														organization.primaryColor,
													),
												},
											]}>
											View All
										</Text>
									</TouchableOpacity>
								</View>
								{upcomingLoading ? (
									<Text style={styles.noDataText}>
										Loading...
									</Text>
								) : upcomingSchedules.length > 0 ? (
									<View style={styles.upcomingPlansList}>
										{upcomingSchedules.map((schedule) => (
											<ScheduleCard
												key={schedule.id}
												schedule={schedule}
												onPress={() =>
													handleSchedulePress(
														schedule,
													)
												}
												onAccept={() =>
													handleAcceptSchedule(
														schedule,
													)
												}
												onDecline={() =>
													handleDeclineSchedule(
														schedule,
													)
												}
											/>
										))}
									</View>
								) : null}
							</View>
						)}
					<View style={styles.announcementsContainer}>
						<View style={styles.announcementsHeader}>
							<Text
								style={[
									styles.headerText,
									{
										color: lightenColor(
											organization.primaryColor,
										),
									},
								]}>
								Announcements
							</Text>
							<TouchableOpacity
								onPress={() =>
									navigation.navigate('Events', {
										filter: 'announcements',
									})
								}>
								<Text
									style={[
										styles.viewAllText,
										{
											color: lightenColor(
												organization.primaryColor,
											),
										},
									]}>
									View All
								</Text>
							</TouchableOpacity>
						</View>
						{recentAnnouncements &&
						recentAnnouncements.length > 0 ? (
							<View style={styles.announcementsList}>
								{recentAnnouncements.map(
									(announcement, index) => (
										<AnnouncementCard
											key={announcement.id || index}
											announcement={announcement}
											onPress={() =>
												handleAnnouncementPress(
													announcement,
												)
											}
											primaryColor={
												organization.primaryColor
											}
										/>
									),
								)}
							</View>
						) : (
							<Text style={styles.noDataText}>
								No announcements available
							</Text>
						)}
					</View>
					<View style={styles.eventsContainer}>
						<View style={styles.eventsHeader}>
							<Text
								style={[
									styles.headerText,
									{
										color: lightenColor(
											organization.primaryColor,
										),
									},
								]}>
								Events
							</Text>
							<TouchableOpacity
								onPress={() =>
									navigation.navigate('Events', {
										filter: 'events',
									})
								}>
								<Text
									style={[
										styles.viewAllText,
										{
											color: lightenColor(
												organization.primaryColor,
											),
										},
									]}>
									View All
								</Text>
							</TouchableOpacity>
						</View>
						{recentEvents && recentEvents.length > 0 ? (
							<View style={styles.eventsList}>
								{recentEvents.map((event, index) => (
									<EventCard
										key={event.id || index}
										event={event}
										onPress={() => handleEventPress(event)}
										primaryColor={organization.primaryColor}
									/>
								))}
							</View>
						) : (
							<Text style={styles.noDataText}>
								No events available
							</Text>
						)}
					</View>
					<View style={styles.mediaContainer}>
						{mediaLoading ? (
							<Text style={styles.noDataText}>
								Loading media...
							</Text>
						) : mediaFiles && mediaFiles.length > 0 ? (
							<>
								<Text
									style={[
										styles.headerText,
										{
											color: lightenColor(
												organization.primaryColor,
											),
										},
										styles.mediaHeaderText,
									]}>
									Featured Media
								</Text>
								<View style={styles.mediaGrid}>
									{mediaFiles.map((media, index) => {
										const isImage = media.fileType
											?.toLowerCase()
											.match(
												/^(jpg|jpeg|png|gif|image\/jpeg|image\/png|image\/gif)$/,
											);
										const isVideo = media.fileType
											?.toLowerCase()
											.match(
												/^(mp4|mov|video\/mp4|video\/quicktime)$/,
											);
										const isAudio = media.fileType
											?.toLowerCase()
											.match(
												/^(mp3|wav|m4a|audio\/mpeg|audio\/mp3|audio\/wav|audio\/m4a)$/,
											);
										const isPDF =
											media.fileType?.toLowerCase() ===
												'pdf' ||
											media.fileType?.toLowerCase() ===
												'application/pdf' ||
											media.fileUrl?.endsWith('.pdf');
										const hasThumbnail =
											media.thumbnailUrl &&
											media.thumbnailUrl.trim() !== '';
										const hasImageUrl =
											isImage &&
											media.fileUrl &&
											media.fileUrl.trim() !== '';

										const isSingleItem =
											mediaFiles.length === 1;
										const resizeMode = isSingleItem
											? 'contain'
											: 'cover';

										return (
											<TouchableOpacity
												key={media.id || index}
												style={[
													styles.mediaSquare,
													isSingleItem && {
														aspectRatio:
															singleMediaAspectRatio ??
															16 / 9,
													},
												]}
												onPress={() =>
													handleMediaPress(media)
												}
												activeOpacity={0.8}>
												{hasImageUrl ? (
													<Image
														source={{
															uri: media.fileUrl,
														}}
														style={
															styles.mediaImage
														}
														resizeMode={resizeMode}
													/>
												) : hasThumbnail ? (
													<>
														<Image
															source={{
																uri: media.thumbnailUrl,
															}}
															style={
																styles.mediaImage
															}
															resizeMode={
																resizeMode
															}
														/>
														{(isVideo || isPDF) && (
															<View
																style={
																	styles.mediaOverlay
																}>
																<View
																	style={
																		styles.overlayIconContainer
																	}>
																	<Icon
																		name={
																			isVideo
																				? 'play-circle-filled'
																				: 'picture-as-pdf'
																		}
																		size={
																			40
																		}
																		color='white'
																		style={
																			styles.overlayIcon
																		}
																	/>
																</View>
															</View>
														)}
													</>
												) : isVideo || isPDF ? (
													<>
														<MediaThumbnail
															media={media}
															isVideo={isVideo}
															isPDF={isPDF}
															style={
																styles.mediaImage
															}
															objectFit={
																resizeMode
															}
														/>
														<View
															style={
																styles.mediaOverlay
															}>
															<View
																style={
																	styles.overlayIconContainer
																}>
																<Icon
																	name={
																		isVideo
																			? 'play-circle-filled'
																			: 'picture-as-pdf'
																	}
																	size={40}
																	color='white'
																	style={
																		styles.overlayIcon
																	}
																/>
															</View>
														</View>
													</>
												) : (
													<View
														style={
															styles.mediaIconContainer
														}>
														<Icon
															name={
																isAudio
																	? 'audiotrack'
																	: 'insert-drive-file'
															}
															size={48}
															color={lightenColor(
																organization.primaryColor,
															)}
														/>
													</View>
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							</>
						) : null}
					</View>
				</View>
			</ScrollView>
			{drawerItem && drawerType && (
				<EventDetailDrawer
					visible={drawerVisible}
					onRequestClose={() => {
						setDrawerVisible(false);
						setDrawerItem(null);
						setDrawerType(null);
					}}
					data={drawerItem}
					type={drawerType}
				/>
			)}
			<DeclineScheduleModal
				visible={declineModalVisible}
				schedule={selectedScheduleForDecline}
				onClose={() => {
					setDeclineModalVisible(false);
					setSelectedScheduleForDecline(null);
				}}
				onConfirm={handleDeclineConfirm}
			/>
		</Background>
	);
};

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
	},
	homeContainer: {
		flex: 1,
		paddingBottom: 20,
	},
	headerContainer: {
		width: '100%',
		height: 200,
		justifyContent: 'flex-end',
		paddingBottom: 20,
	},
	coverQRButton: {
		position: 'absolute',
		top: 16,
		right: 16,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(0,0,0,0.4)',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	rowContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	organizationIcon: {
		width: 80,
		height: 80,
		borderRadius: 30,
		marginHorizontal: 15,
	},
	organizationName: {
		...typography.h2,
		color: '#FFFFFF',
	},
	organizationLocation: {
		...typography.body,
		color: '#FFFFFF',
	},
	buttonContainer: {
		paddingHorizontal: 20,
		marginVertical: 15,
	},
	announcementsContainer: {
		marginVertical: 10,
	},
	upcomingPlansContainer: {
		marginVertical: 10,
	},
	upcomingPlansList: {
		marginTop: 4,
		gap: 8,
	},
	eventsContainer: {
		marginVertical: 10,
	},
	mediaContainer: {
		marginVertical: 10,
	},
	mediaHeaderText: {
		marginLeft: 20,
		marginBottom: 12,
	},
	mediaGrid: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		gap: 12,
		alignItems: 'flex-start',
	},
	mediaSquare: {
		flex: 1,
		aspectRatio: 1,
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
	},
	mediaImage: {
		width: '100%',
		height: '100%',
	},
	mediaOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	overlayIconContainer: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 30,
		padding: 8,
	},
	overlayIcon: {
		textShadowColor: 'rgba(0, 0, 0, 0.75)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	mediaIconContainer: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	announcementsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		marginBottom: 12,
	},
	viewAllText: {
		...typography.bodyMedium,
		fontSize: 14,
		fontWeight: '600',
	},
	headerText: {
		...typography.h2,
		fontSize: 20,
		fontWeight: '600',
	},
	carouselHeaderText: {
		marginLeft: 20,
		marginBottom: 10,
	},
	announcementsList: {
		marginTop: 4,
	},
	eventsList: {
		marginTop: 4,
	},
	eventsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		marginBottom: 12,
	},
	noDataText: {
		...typography.body,
		color: '#FFFFFF',
		textAlign: 'center',
		marginTop: 20,
	},
	actionRowContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		marginTop: 20,
		marginBottom: 10,
		justifyContent: 'space-between',
		gap: 12,
	},
	actionButton: {
		flex: 1,
		flexDirection: 'row',
		height: 50,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	actionButtonText: {
		...typography.bodyBold,
		color: '#FFFFFF',
		fontSize: 16,
		marginLeft: 8,
	},
});

export default HomeScreen;
