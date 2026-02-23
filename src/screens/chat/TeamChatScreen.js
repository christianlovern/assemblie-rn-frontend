import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	Image,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	Alert,
	Keyboard,
	Platform,
	RefreshControl,
	Dimensions,
	Linking,
	Modal,
	ScrollView,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
	useRoute,
	useNavigation,
	useIsFocused,
} from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import {
	teamChatApi,
	MAX_CONTENT_LENGTH,
	MAX_FILES,
	MAX_FILE_BYTES,
	isAllowedMime,
} from '../../../api/teamChatRoutes';
import {
	connectTeamChatSocket,
	joinTeamRoom,
	leaveTeamRoom,
	onNewTeamMessage,
} from '../../../api/teamChatSocket';
import { TokenStorage } from '../../../api/tokenStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const PAGE_SIZE = 50;
const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const EMPTY_LIST_MIN_HEIGHT = WINDOW_HEIGHT - 220;
/** Reserve space so the message list doesn't sit under the input bar (input row ~72 + padding). */
const INPUT_BAR_RESERVED_HEIGHT = 72;

/** Backend reaction types and their icons (MaterialCommunityIcons). */
const REACTION_TYPES = [
	{ type: 'heart', icon: 'heart' },
	{ type: 'thumbsup', icon: 'thumb-up' },
	{ type: 'thumbsdown', icon: 'thumb-down' },
	{ type: 'laugh', icon: 'emoticon-happy-outline' },
	{ type: 'sad', icon: 'emoticon-sad-outline' },
	{ type: 'angry', icon: 'emoticon-angry-outline' },
];

/** Renders a single attachment: image preview for image/*, file chip with name otherwise. */
function MessageAttachment({
	teamId,
	messageId,
	att,
	isOwn,
	colors,
	onPress,
	onLongPress,
}) {
	const [imageUri, setImageUri] = useState(null);
	const isImage = att.mimeType && att.mimeType.startsWith('image/');

	useEffect(() => {
		if (!isImage) return;
		let cancelled = false;
		teamChatApi
			.getAttachmentDownloadUrl(teamId, messageId, att.id)
			.then((res) => {
				if (!cancelled && res?.url) setImageUri(res.url);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [teamId, messageId, att.id, isImage]);

	if (isImage) {
		if (imageUri) {
			return (
				<TouchableOpacity
					style={[
						styles.attachmentImageWrap,
						isOwn && styles.attachmentImageWrapOwn,
					]}
					onPress={() => onPress(messageId, att)}
					onLongPress={onLongPress}
					delayLongPress={400}
					activeOpacity={0.8}>
					<Image
						source={{ uri: imageUri }}
						style={styles.attachmentImage}
						resizeMode='cover'
					/>
				</TouchableOpacity>
			);
		}
		// Placeholder while image URL is loading
		return (
			<View
				style={[
					styles.attachmentImageWrap,
					styles.attachmentImagePlaceholder,
					isOwn && styles.attachmentImageWrapOwn,
				]}>
				<Icon
					name='image-outline'
					size={40}
					color={colors.textSecondary}
				/>
			</View>
		);
	}

	// Document/PDF/file: show file name prominently with icon
	const fileName = att.originalName || 'Document';
	const fileSizeStr =
		att.fileSize != null ? formatFileSize(att.fileSize) : null;
	const isPdf =
		att.mimeType === 'application/pdf' ||
		(fileName && fileName.toLowerCase().endsWith('.pdf'));

	return (
		<TouchableOpacity
			key={att.id}
			style={[
				styles.attachmentChip,
				{
					backgroundColor: isOwn
						? 'rgba(255,255,255,0.2)'
						: colors.textSecondary + '25',
				},
			]}
			onPress={() => onPress(messageId, att)}
			onLongPress={onLongPress}
			delayLongPress={400}
			activeOpacity={0.7}>
			<View style={styles.attachmentFileIconWrap}>
				<Icon
					name={isPdf ? 'file-pdf-box' : 'file-document-outline'}
					size={32}
					color={isOwn ? '#fff' : colors.primary}
				/>
			</View>
			<View style={styles.attachmentFileTextWrap}>
				<Text
					style={[
						styles.attachmentFileName,
						{ color: isOwn ? '#fff' : colors.text },
					]}
					numberOfLines={2}>
					{fileName}
				</Text>
				{fileSizeStr != null && (
					<Text
						style={[
							styles.attachmentFileSize,
							{
								color: isOwn
									? 'rgba(255,255,255,0.8)'
									: colors.textSecondary,
							},
						]}>
						{fileSizeStr}
					</Text>
				)}
			</View>
			<Icon
				name='open-in-new'
				size={18}
				color={isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary}
				style={styles.attachmentFileChevron}
			/>
		</TouchableOpacity>
	);
}

const TeamChatScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const {
		teamId,
		teamName,
		organizationId,
		messageId: initialMessageId,
	} = route.params || {};
	const { user, organization } = useData();
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const [messages, setMessages] = useState([]);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [sending, setSending] = useState(false);
	const [inputText, setInputText] = useState('');
	const [loadingMore, setLoadingMore] = useState(false);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [attachmentViewer, setAttachmentViewer] = useState(null);
	const [attachmentDownloading, setAttachmentDownloading] = useState(false);
	const [reactionPickerMessageId, setReactionPickerMessageId] =
		useState(null);
	const [reactionActionLoading, setReactionActionLoading] = useState(false);
	const listRef = useRef(null);
	const currentTeamIdRef = useRef(teamId);
	currentTeamIdRef.current = teamId;

	useEffect(() => {
		const showSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e) => setKeyboardHeight(e.endCoordinates.height),
		);
		const hideSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => setKeyboardHeight(0),
		);
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const isTeamLead = Boolean(user?.leadTeams?.some((t) => t.id === teamId));

	const loadMessages = useCallback(
		async (before = null, append = false) => {
			if (!teamId) return;
			try {
				if (!append) setLoading(true);
				else setLoadingMore(true);
				const data = await teamChatApi.getMessages(teamId, {
					limit: PAGE_SIZE,
					before: before ?? undefined,
				});
				const list = data.messages || [];
				if (append) {
					setMessages((prev) => [...prev, ...list]);
				} else {
					setMessages(list);
				}
				setHasMore(Boolean(data.hasMore));
			} catch (err) {
				const msg =
					err.response?.data?.error ||
					err.response?.data?.message ||
					'Failed to load messages';
				if (err.response?.status === 403) {
					Alert.alert('Access denied', msg, [
						{ text: 'OK', onPress: () => navigation.goBack() },
					]);
					return;
				}
				Alert.alert('Error', msg);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[teamId, navigation],
	);

	const refresh = useCallback(() => {
		setRefreshing(true);
		loadMessages(null, false).finally(() => setRefreshing(false));
	}, [loadMessages]);

	useEffect(() => {
		if (teamId && isFocused) loadMessages();
	}, [teamId, isFocused, loadMessages]);

	// When opened from push with messageId, scroll to that message once messages are loaded
	useEffect(() => {
		if (!initialMessageId || !messages.length || !listRef.current) return;
		const index = messages.findIndex(
			(m) => String(m.id) === String(initialMessageId),
		);
		if (index === -1) return;
		const t = setTimeout(() => {
			try {
				listRef.current?.scrollToIndex({
					index,
					viewPosition: 0.5,
					animated: true,
				});
			} catch (e) {
				// scrollToIndex can fail if list not fully laid out
			}
		}, 400);
		return () => clearTimeout(t);
	}, [messages, initialMessageId]);

	// Socket: connect and join team room when viewing this chat; leave on blur
	useEffect(() => {
		if (!teamId || !isFocused) {
			if (teamId) leaveTeamRoom(teamId);
			return;
		}
		let unsubNewMessage = () => {};
		const doJoin = () => {
			joinTeamRoom(teamId, (res) => {
				if (res?.error) console.warn('join_team error:', res.error);
			});
		};
		const setup = async () => {
			const token = await TokenStorage.getToken();
			if (!token) return;
			const sock = connectTeamChatSocket(token);
			if (sock.connected) doJoin();
			else sock.once('connect', doJoin);
			unsubNewMessage = onNewTeamMessage((message) => {
				if (message.teamId !== currentTeamIdRef.current) return;
				// Ignore our own messages—we already add them from the POST response
				if (message.userId === user?.id) return;
				setMessages((prev) => {
					if (prev.some((m) => m.id === message.id)) return prev;
					return [message, ...prev];
				});
			});
		};
		setup();
		return () => {
			unsubNewMessage();
			leaveTeamRoom(teamId);
		};
	}, [teamId, isFocused]);

	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore || messages.length === 0) return;
		const oldest = messages[messages.length - 1];
		const before = oldest?.id ?? oldest?.createdAt;
		if (before == null) return;
		loadMessages(before, true);
	}, [hasMore, loadingMore, messages, loadMessages]);

	const handleSend = async () => {
		const content = inputText.trim();
		const files = pendingFiles.length ? pendingFiles : undefined;
		if (!teamId || sending) return;
		if (!content && (!files || files.length === 0)) return;
		if (files?.length) {
			console.log(
				'[TeamChat] Sending with files:',
				files.length,
				files.map((f) => ({
					uri: (f.uri || '').slice(0, 80),
					name: f.name,
					mimeType: f.mimeType,
					size: f.size,
				})),
			);
		}
		setSending(true);
		setInputText('');
		setPendingFiles([]);
		try {
			const newMsg = await teamChatApi.sendMessage(teamId, {
				content: content || '',
				files,
			});
			setMessages((prev) => [newMsg, ...prev]);
			if (files?.length) console.log('[TeamChat] Send succeeded');
		} catch (err) {
			console.log('[TeamChat] Send failed:', {
				message: err?.message,
				code: err?.code,
				status: err?.response?.status,
				data: err?.response?.data,
				response: err?.response
					? { status: err.response.status, data: err.response.data }
					: null,
			});
			const msg =
				err.response?.data?.message ||
				err.response?.data?.error ||
				'Failed to send message';
			Alert.alert('Error', msg);
			setInputText(content);
			if (files?.length) setPendingFiles(files);
		} finally {
			setSending(false);
		}
	};

	const pickFromLibrary = async () => {
		const canAdd = MAX_FILES - pendingFiles.length;
		if (canAdd <= 0) {
			Alert.alert(
				'Limit',
				`You can attach up to ${MAX_FILES} files per message.`,
			);
			return;
		}
		try {
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert(
					'Permission needed',
					'Allow access to your photos and videos to attach them.',
				);
				return;
			}
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.All,
				allowsMultipleSelection: true,
				selectionLimit: canAdd,
				quality: 1,
			});
			if (result.canceled) return;
			const assets = result.assets || [];
			const toAdd = [];
			for (const a of assets) {
				if (toAdd.length >= canAdd) break;
				if (a.fileSize != null && a.fileSize > MAX_FILE_BYTES) {
					Alert.alert(
						'File too large',
						`${a.fileName || a.name || 'Media'} is over 25 MB.`,
					);
					continue;
				}
				const mimeType =
					a.mimeType ??
					(a.type === 'video' ? 'video/mp4' : 'image/jpeg');
				if (!isAllowedMime(mimeType)) {
					Alert.alert(
						'File type not allowed',
						`${a.fileName || a.name || 'File'} type is not supported.`,
					);
					continue;
				}
				const fileName =
					a.fileName ||
					a.name ||
					(a.type === 'video' ? 'video.mp4' : 'image.jpg');
				toAdd.push({
					uri: a.uri,
					name: fileName,
					mimeType,
					size: a.fileSize,
				});
			}
			setPendingFiles((prev) => [...prev, ...toAdd].slice(0, MAX_FILES));
		} catch (e) {
			Alert.alert('Error', e?.message || 'Failed to pick from library');
		}
	};

	const pickDocuments = async () => {
		const canAdd = MAX_FILES - pendingFiles.length;
		if (canAdd <= 0) {
			Alert.alert(
				'Limit',
				`You can attach up to ${MAX_FILES} files per message.`,
			);
			return;
		}
		try {
			const result = await DocumentPicker.getDocumentAsync({
				multiple: canAdd > 1,
				copyToCacheDirectory: true,
				type: [
					'image/*',
					'video/*',
					'audio/*',
					'application/pdf',
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					'application/msword',
					'application/vnd.ms-excel',
					'text/plain',
					'text/csv',
				],
			});
			if (result.canceled) return;
			const assets = result.assets || [];
			const toAdd = [];
			for (const a of assets) {
				if (toAdd.length >= canAdd) break;
				if (a.size != null && a.size > MAX_FILE_BYTES) {
					Alert.alert('File too large', `${a.name} is over 25 MB.`);
					continue;
				}
				if (a.mimeType && !isAllowedMime(a.mimeType)) {
					Alert.alert(
						'File type not allowed',
						`${a.name} type is not supported.`,
					);
					continue;
				}
				toAdd.push({
					uri: a.uri,
					name: a.name,
					mimeType: a.mimeType,
					size: a.size,
				});
			}
			setPendingFiles((prev) => [...prev, ...toAdd].slice(0, MAX_FILES));
		} catch (e) {
			Alert.alert('Error', e?.message || 'Failed to pick files');
		}
	};

	const pickAttachments = () => {
		const canAdd = MAX_FILES - pendingFiles.length;
		if (canAdd <= 0) {
			Alert.alert(
				'Limit',
				`You can attach up to ${MAX_FILES} files per message.`,
			);
			return;
		}
		Alert.alert('Attach', 'Choose from your library or pick a document.', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Photo or video', onPress: pickFromLibrary },
			{ text: 'Document or audio', onPress: pickDocuments },
		]);
	};

	const removePendingFile = (index) => {
		setPendingFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const openAttachment = async (messageId, att) => {
		try {
			const { url } = await teamChatApi.getAttachmentDownloadUrl(
				teamId,
				messageId,
				att.id,
			);
			if (!url) return;
			const name = att.originalName || 'Document';
			const mimeType = att.mimeType || '';
			const isPdf =
				mimeType === 'application/pdf' ||
				(name && name.toLowerCase().endsWith('.pdf'));
			if (isPdf) {
				navigation.navigate('FileView', {
					fileUrl: url,
					fileName: name,
					fileType: 'application/pdf',
				});
				return;
			}
			setAttachmentViewer({
				messageId,
				att,
				url,
				mimeType,
				name,
			});
		} catch (err) {
			const msg =
				err.response?.data?.message ||
				err.response?.data?.error ||
				'Failed to open file';
			Alert.alert('Error', msg);
		}
	};

	const downloadAttachment = async () => {
		if (!attachmentViewer?.url || attachmentDownloading) return;
		setAttachmentDownloading(true);
		try {
			const { url, name } = attachmentViewer;
			const ext =
				(name && name.includes('.')
					? name.slice(name.lastIndexOf('.'))
					: '') || '.bin';
			const safeName = (name || 'attachment').replace(
				/[^a-zA-Z0-9.-]/g,
				'_',
			);
			const destination = new File(
				Paths.cache,
				`team_chat_${Date.now()}_${safeName}${ext}`,
			);
			const output = await File.downloadFileAsync(url, destination, {
				idempotent: true,
			});
			const canShare = await Sharing.isAvailableAsync();
			if (canShare) {
				await Sharing.shareAsync(output.uri, {
					mimeType:
						attachmentViewer.mimeType || 'application/octet-stream',
					dialogTitle: 'Save or share',
				});
			} else {
				Alert.alert('Saved', `File saved to cache.`);
			}
		} catch (err) {
			Alert.alert(
				'Download failed',
				err?.message || 'Could not download file.',
			);
		} finally {
			setAttachmentDownloading(false);
		}
	};

	const handleDeleteMessage = (message) => {
		const canDelete = message.userId === user?.id || isTeamLead;
		if (!canDelete) return;
		Alert.alert('Delete message', 'Remove this message from the chat?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						await teamChatApi.deleteMessage(teamId, message.id);
						setMessages((prev) =>
							prev.filter((m) => m.id !== message.id),
						);
					} catch (err) {
						const msg =
							err.response?.data?.message ||
							'Failed to delete message';
						Alert.alert('Error', msg);
					}
				},
			},
		]);
	};

	const handleReactionSelect = useCallback(
		async (messageId, type) => {
			if (!teamId || reactionActionLoading) return;
			const message = messages.find((m) => m.id === messageId);
			if (!message) return;
			const reactionEntry = (message.reactions || []).find(
				(r) => r.type === type,
			);
			const hasMine =
				user?.id && reactionEntry?.userIds?.includes(user.id);
			setReactionActionLoading(true);
			try {
				const updated = hasMine
					? await teamChatApi.removeReaction(teamId, messageId, type)
					: await teamChatApi.addReaction(teamId, messageId, type);
				setMessages((prev) =>
					prev.map((m) => (m.id === updated.id ? updated : m)),
				);
			} catch (err) {
				const msg =
					err.response?.data?.message ||
					err.response?.data?.error ||
					'Failed to update reaction';
				Alert.alert('Error', msg);
			} finally {
				setReactionActionLoading(false);
				setReactionPickerMessageId(null);
			}
		},
		[teamId, messages, user?.id, reactionActionLoading],
	);

	const handleDeleteChat = () => {
		if (!isTeamLead) return;
		Alert.alert(
			'Delete chat',
			'Remove all messages in this team chat? This cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete all',
					style: 'destructive',
					onPress: async () => {
						try {
							await teamChatApi.deleteChat(teamId);
							setMessages([]);
							setHasMore(false);
						} catch (err) {
							const msg =
								err.response?.data?.message ||
								'Only team leads or organization admins can delete the team chat';
							Alert.alert('Error', msg);
						}
					},
				},
			],
		);
	};

	if (!teamId) {
		return (
			<View
				style={[styles.center, { backgroundColor: colors.background }]}>
				<Text style={{ color: colors.text }}>No team selected</Text>
			</View>
		);
	}

	const renderMessage = ({ item }) => {
		const isOwn = item.userId === user?.id;
		const canDelete = isOwn || isTeamLead;
		const author = item.author;
		const name = author
			? [author.firstName, author.lastName].filter(Boolean).join(' ') ||
				'Unknown'
			: 'Unknown';

		return (
			<View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
				<TouchableOpacity
					activeOpacity={1}
					onLongPress={() => setReactionPickerMessageId(item.id)}
					delayLongPress={400}
					style={[
						styles.bubble,
						isOwn
							? {
									backgroundColor: colors.primary,
									alignSelf: 'flex-end',
								}
							: {
									backgroundColor:
										colors.textSecondary + '30',
									alignSelf: 'flex-start',
								},
					]}>
					{!isOwn && (
						<Text
							style={[
								styles.authorName,
								{ color: colors.primary },
							]}
							numberOfLines={1}>
							{name}
						</Text>
					)}
					<Text
						style={[
							styles.content,
							{ color: isOwn ? '#fff' : colors.text },
						]}>
						{item.content || ''}
					</Text>
					{(item.attachments || []).length > 0 && (
						<View style={styles.attachmentsWrap}>
							{(item.attachments || []).map((att) => (
								<MessageAttachment
									key={att.id}
									teamId={teamId}
									messageId={item.id}
									att={att}
									isOwn={isOwn}
									colors={colors}
									onPress={openAttachment}
									onLongPress={() =>
										setReactionPickerMessageId(item.id)
									}
								/>
							))}
						</View>
					)}
					<View style={styles.messageFooter}>
						<Text
							style={[
								styles.time,
								{
									color: isOwn
										? 'rgba(255,255,255,0.8)'
										: colors.textSecondary,
								},
							]}>
							{formatTime(item.createdAt)}
						</Text>
						{canDelete && (
							<TouchableOpacity
								hitSlop={{
									top: 8,
									bottom: 8,
									left: 8,
									right: 8,
								}}
								onPress={() => handleDeleteMessage(item)}>
								<Icon
									name='delete-outline'
									size={16}
									color={
										isOwn
											? 'rgba(255,255,255,0.8)'
											: colors.textSecondary
									}
								/>
							</TouchableOpacity>
						)}
					</View>
					{/* Reactions: only show when message has reactions (from backend) */}
					{(item.reactions || []).length > 0 && (
						<View style={styles.reactionsRow}>
							{(item.reactions || []).map((r) => {
								const preset = REACTION_TYPES.find(
									(p) => p.type === r.type,
								);
								const icon = preset?.icon || 'emoticon-outline';
								const isMine =
									user?.id &&
									(r.userIds || []).includes(user.id);
								return (
									<View
										key={r.type}
										style={[
											styles.reactionChip,
											{
												backgroundColor: isMine
													? isOwn
														? 'rgba(255,255,255,0.35)'
														: colors.primary + '35'
													: isOwn
														? 'rgba(255,255,255,0.15)'
														: colors.textSecondary +
															'18',
												borderColor: isMine
													? isOwn
														? 'rgba(255,255,255,0.6)'
														: colors.primary
													: 'transparent',
											},
										]}>
										<Icon
											name={icon}
											size={16}
											color={
												isOwn
													? 'rgba(255,255,255,0.95)'
													: colors.text
											}
										/>
										{(r.count || 0) > 0 && (
											<Text
												style={[
													styles.reactionCount,
													{
														color: isOwn
															? 'rgba(255,255,255,0.9)'
															: colors.textSecondary,
													},
												]}>
												{r.count}
											</Text>
										)}
									</View>
								);
							})}
						</View>
					)}
				</TouchableOpacity>
			</View>
		);
	};

	const renderEmpty = () => (
		<View style={[styles.emptyWrap, { minHeight: EMPTY_LIST_MIN_HEIGHT }]}>
			<Text
				style={[styles.emptyText, { color: colors.textSecondary }]}
				numberOfLines={2}
				textAlign='center'>
				It is quiet in here, let's get to chatting!
			</Text>
		</View>
	);

	return (
		<View
			style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.main}>
				<View
					style={[
						styles.header,
						{ borderBottomColor: colors.textSecondary + '30' },
					]}>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={styles.backBtn}>
						<Icon
							name='arrow-left'
							size={24}
							color={colors.text}
						/>
					</TouchableOpacity>
					<Text
						style={[styles.headerTitle, { color: colors.text }]}
						numberOfLines={1}>
						{teamName || 'Team Chat'}
					</Text>
					{isTeamLead && (
						<TouchableOpacity
							onPress={handleDeleteChat}
							style={styles.deleteChatBtn}>
							<Icon
								name='delete-sweep'
								size={24}
								color={colors.textSecondary}
							/>
						</TouchableOpacity>
					)}
				</View>

				{loading ? (
					<View style={styles.loadingWrap}>
						<ActivityIndicator
							size='large'
							color={colors.primary}
						/>
					</View>
				) : (
					<>
						<View
							style={[
								styles.listWrap,
								{
									paddingBottom:
										INPUT_BAR_RESERVED_HEIGHT +
										keyboardHeight,
								},
							]}>
							{messages.length === 0 ? (
								<View
									style={[
										styles.listContent,
										styles.listContentEmpty,
										{ paddingBottom: 0, flexGrow: 1 },
									]}>
									{renderEmpty()}
								</View>
							) : (
								<FlatList
									ref={listRef}
									data={messages}
									keyExtractor={(item) => String(item.id)}
									renderItem={renderMessage}
									inverted
									onScrollBeginDrag={Keyboard.dismiss}
									contentContainerStyle={[
										styles.listContent,
										{
											paddingBottom:
												INPUT_BAR_RESERVED_HEIGHT +
												keyboardHeight +
												insets.bottom,
										},
									]}
									keyboardShouldPersistTaps='handled'
									keyboardDismissMode='on-drag'
									refreshControl={
										<RefreshControl
											refreshing={refreshing}
											onRefresh={refresh}
											tintColor={colors.primary}
										/>
									}
									ListFooterComponent={
										hasMore && !loadingMore ? (
											<TouchableOpacity
												style={styles.loadMoreWrap}
												onPress={loadMore}>
												<Text
													style={[
														styles.loadMoreText,
														{
															color: colors.primary,
														},
													]}>
													Load older messages
												</Text>
											</TouchableOpacity>
										) : loadingMore ? (
											<ActivityIndicator
												size='small'
												color={colors.primary}
												style={styles.loadMoreSpinner}
											/>
										) : null
									}
								/>
							)}
						</View>
					</>
				)}
			</View>
			<View
				style={[
					styles.inputRowWrap,
					{
						borderTopColor: colors.textSecondary + '20',
						backgroundColor: colors.background,
						bottom: keyboardHeight,
					},
				]}>
				{pendingFiles.length > 0 && (
					<View style={styles.pendingFilesRow}>
						{pendingFiles.map((f, i) => (
							<View
								key={`${f.uri}-${i}`}
								style={[
									styles.pendingFileChip,
									{
										backgroundColor:
											colors.textSecondary + '25',
									},
								]}>
								<View style={styles.pendingFileIconWrap}>
									<Icon
										name='file-document-outline'
										size={28}
										color={colors.primary}
									/>
								</View>
								<View style={styles.pendingFileTextWrap}>
									<Text
										style={[
											styles.pendingFileLabel,
											{ color: colors.text },
										]}
										numberOfLines={2}>
										{f.name || 'File'}
									</Text>
									{f.size != null && (
										<Text
											style={[
												styles.pendingFileSize,
												{
													color: colors.textSecondary,
												},
											]}>
											{formatFileSize(f.size)}
										</Text>
									)}
								</View>
								<TouchableOpacity
									style={styles.pendingFileRemove}
									hitSlop={{
										top: 12,
										bottom: 12,
										left: 12,
										right: 12,
									}}
									onPress={() => removePendingFile(i)}>
									<Icon
										name='close-circle'
										size={24}
										color={colors.textSecondary}
									/>
								</TouchableOpacity>
							</View>
						))}
					</View>
				)}
				<View style={styles.inputRow}>
					<TouchableOpacity
						style={[
							styles.attachBtn,
							{
								backgroundColor: colors.textSecondary + '20',
							},
						]}
						onPress={pickAttachments}
						disabled={sending || pendingFiles.length >= MAX_FILES}>
						<Icon
							name='paperclip'
							size={22}
							color={colors.text}
						/>
					</TouchableOpacity>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: colors.textSecondary + '18',
								color: colors.text,
								borderColor: colors.textSecondary + '40',
							},
						]}
						placeholder='Message...'
						placeholderTextColor={colors.textSecondary}
						value={inputText}
						onChangeText={setInputText}
						multiline
						maxLength={MAX_CONTENT_LENGTH}
						editable={!sending}
					/>
					<TouchableOpacity
						style={[
							styles.sendBtn,
							{ backgroundColor: colors.primary },
						]}
						onPress={handleSend}
						disabled={
							sending ||
							(!inputText.trim() && pendingFiles.length === 0)
						}>
						{sending ? (
							<ActivityIndicator
								size='small'
								color='#fff'
							/>
						) : (
							<Icon
								name='send'
								size={24}
								color='#fff'
							/>
						)}
					</TouchableOpacity>
				</View>
			</View>
			{/* In-app attachment viewer: view image/file and download */}
			<Modal
				visible={Boolean(attachmentViewer)}
				transparent
				animationType='fade'
				onRequestClose={() => setAttachmentViewer(null)}>
				<View style={styles.attachmentModalOverlay}>
					<View
						style={[
							styles.attachmentModalContent,
							{ backgroundColor: colors.background },
						]}>
						<View style={styles.attachmentModalHeader}>
							<Text
								style={[
									styles.attachmentModalTitle,
									{ color: colors.text },
								]}
								numberOfLines={1}>
								{attachmentViewer?.name || 'Attachment'}
							</Text>
							<TouchableOpacity
								onPress={() => setAttachmentViewer(null)}
								style={styles.attachmentModalClose}>
								<Icon
									name='close'
									size={28}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>
						<ScrollView
							style={styles.attachmentModalBody}
							contentContainerStyle={
								styles.attachmentModalBodyContent
							}
							showsVerticalScrollIndicator>
							{attachmentViewer?.mimeType?.startsWith(
								'image/',
							) ? (
								<Image
									source={{ uri: attachmentViewer.url }}
									style={styles.attachmentModalImage}
									resizeMode='contain'
								/>
							) : (
								<View style={styles.attachmentModalFileCard}>
									<Icon
										name='file-document-outline'
										size={64}
										color={colors.primary}
									/>
									<Text
										style={[
											styles.attachmentModalFileLabel,
											{ color: colors.text },
										]}
										numberOfLines={2}>
										{attachmentViewer?.name || 'File'}
									</Text>
									<Text
										style={[
											styles.attachmentModalFileHint,
											{ color: colors.textSecondary },
										]}>
										Use Download to save or open in another
										app
									</Text>
								</View>
							)}
						</ScrollView>
						<View
							style={[
								styles.attachmentModalFooter,
								{ borderTopColor: colors.textSecondary + '30' },
							]}>
							<TouchableOpacity
								style={[
									styles.attachmentModalDownloadBtn,
									{ backgroundColor: colors.primary },
								]}
								onPress={downloadAttachment}
								disabled={attachmentDownloading}>
								{attachmentDownloading ? (
									<ActivityIndicator
										size='small'
										color='#fff'
									/>
								) : (
									<>
										<Icon
											name='download'
											size={22}
											color='#fff'
										/>
										<Text
											style={
												styles.attachmentModalDownloadLabel
											}>
											Download
										</Text>
									</>
								)}
							</TouchableOpacity>
							{!attachmentViewer?.mimeType?.startsWith(
								'image/',
							) && (
								<TouchableOpacity
									style={[
										styles.attachmentModalOpenBtn,
										{ borderColor: colors.primary },
									]}
									onPress={async () => {
										if (attachmentViewer?.url) {
											await Linking.openURL(
												attachmentViewer.url,
											);
										}
									}}>
									<Icon
										name='open-in-new'
										size={20}
										color={colors.primary}
									/>
									<Text
										style={[
											styles.attachmentModalOpenLabel,
											{ color: colors.primary },
										]}>
										Open externally
									</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</Modal>

			{/* Reaction picker: shown on long-press; tap a reaction to add/remove */}
			<Modal
				visible={Boolean(reactionPickerMessageId)}
				transparent
				animationType='fade'
				onRequestClose={() => setReactionPickerMessageId(null)}>
				<View style={styles.reactionPickerOverlay}>
					<TouchableOpacity
						activeOpacity={1}
						style={StyleSheet.absoluteFill}
						onPress={() => setReactionPickerMessageId(null)}
					/>
					<View
						style={[
							styles.reactionPickerBubble,
							{
								backgroundColor:
									colors.cardBackground || colors.background,
							},
							styles.reactionPickerShadow,
						]}>
						<Text
							style={[
								styles.reactionPickerLabel,
								{ color: colors.textSecondary },
							]}>
							Add reaction
						</Text>
						<View style={styles.reactionPickerRow}>
							{REACTION_TYPES.map(({ type, icon }) => {
								const message = messages.find(
									(m) => m.id === reactionPickerMessageId,
								);
								const reactionEntry = (
									message?.reactions || []
								).find((r) => r.type === type);
								const hasMine =
									user?.id &&
									reactionEntry?.userIds?.includes(user.id);
								return (
									<TouchableOpacity
										key={type}
										style={[
											styles.reactionPickerIconWrap,
											hasMine && {
												backgroundColor:
													colors.primary + '25',
											},
										]}
										onPress={() =>
											handleReactionSelect(
												reactionPickerMessageId,
												type,
											)
										}
										disabled={reactionActionLoading}>
										<Icon
											name={icon}
											size={28}
											color={
												hasMine
													? colors.primary
													: colors.text
											}
										/>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
};

function formatTime(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	const now = new Date();
	const isToday = d.toDateString() === now.toDateString();
	if (isToday) {
		return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
	return d.toLocaleDateString([], {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

function formatFileSize(bytes) {
	if (bytes == null || bytes < 1024) return `${bytes || 0} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	main: {
		flex: 1,
	},
	emptyWrap: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyText: {
		...typography.body,
		textAlign: 'center',
	},
	listContentEmpty: {
		flexGrow: 1,
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 12,
		// paddingTop: Platform.OS === 'ios' ? 50 : 12,
		borderBottomWidth: 1,
	},
	backBtn: {
		padding: 8,
		marginRight: 8,
	},
	headerTitle: {
		...typography.h3,
		flex: 1,
	},
	deleteChatBtn: {
		padding: 8,
	},
	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	listWrap: {
		flex: 1,
	},
	listContent: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingBottom: 16,
	},
	messageRow: {
		marginBottom: 8,
		alignItems: 'flex-start',
	},
	messageRowOwn: {
		alignItems: 'flex-end',
	},
	bubble: {
		maxWidth: '85%',
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 16,
	},
	authorName: {
		...typography.bodySmall,
		marginBottom: 2,
		fontWeight: '600',
	},
	content: {
		...typography.body,
	},
	attachmentsWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
		marginTop: 8,
	},
	attachmentChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		gap: 12,
		maxWidth: '100%',
		minWidth: 160,
	},
	attachmentFileIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 8,
		backgroundColor: 'rgba(0,0,0,0.06)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	attachmentFileTextWrap: {
		flex: 1,
		minWidth: 0,
		justifyContent: 'center',
	},
	attachmentFileName: {
		...typography.body,
		fontSize: 15,
		fontWeight: '500',
	},
	attachmentFileSize: {
		...typography.bodySmall,
		fontSize: 12,
		marginTop: 2,
	},
	attachmentFileChevron: {
		marginLeft: 4,
	},
	attachmentImageWrap: {
		width: 200,
		height: 200,
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: 'rgba(0,0,0,0.06)',
	},
	attachmentImageWrapOwn: {
		alignSelf: 'flex-end',
	},
	attachmentImage: {
		width: '100%',
		height: '100%',
	},
	attachmentImagePlaceholder: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	attachmentLabel: {
		...typography.bodySmall,
		flex: 1,
	},
	attachmentModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.85)',
		justifyContent: 'center',
		padding: 16,
	},
	attachmentModalContent: {
		maxHeight: '90%',
		borderRadius: 16,
		overflow: 'hidden',
	},
	attachmentModalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0,0,0,0.08)',
	},
	attachmentModalTitle: {
		...typography.bodyLarge,
		flex: 1,
	},
	attachmentModalClose: {
		padding: 4,
	},
	attachmentModalBody: {
		maxHeight: 400,
	},
	attachmentModalBodyContent: {
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 200,
	},
	attachmentModalImage: {
		width: Dimensions.get('window').width - 64,
		height: 360,
	},
	attachmentModalFileCard: {
		alignItems: 'center',
		paddingVertical: 32,
		paddingHorizontal: 24,
	},
	attachmentModalFileLabel: {
		...typography.bodyLarge,
		marginTop: 12,
		textAlign: 'center',
	},
	attachmentModalFileHint: {
		...typography.bodySmall,
		marginTop: 8,
		textAlign: 'center',
	},
	attachmentModalFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		padding: 16,
		borderTopWidth: 1,
	},
	attachmentModalDownloadBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
	},
	attachmentModalDownloadLabel: {
		...typography.body,
		color: '#fff',
		fontWeight: '600',
	},
	attachmentModalOpenBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		borderWidth: 2,
	},
	attachmentModalOpenLabel: {
		...typography.body,
		fontWeight: '600',
	},
	messageFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: 4,
		gap: 8,
	},
	reactionsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 6,
		marginTop: 8,
	},
	reactionChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 12,
		borderWidth: 1,
		gap: 4,
	},
	reactionCount: {
		...typography.bodySmall,
		fontSize: 12,
		minWidth: 14,
		textAlign: 'center',
	},
	reactionPickerOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	reactionPickerBubble: {
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 20,
		minWidth: 280,
	},
	reactionPickerShadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
	reactionPickerLabel: {
		...typography.bodySmall,
		marginBottom: 12,
		textAlign: 'center',
	},
	reactionPickerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 8,
	},
	reactionPickerIconWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 12,
	},
	time: {
		...typography.bodySmall,
		fontSize: 11,
	},
	loadMoreWrap: {
		paddingVertical: 12,
		alignItems: 'center',
	},
	loadMoreText: {
		...typography.bodySmall,
	},
	loadMoreSpinner: {
		marginVertical: 12,
	},
	inputRowWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		minHeight: 72,
		maxHeight: 72,
		paddingHorizontal: 12,
		paddingTop: 10,
		paddingBottom: Platform.OS === 'ios' ? 28 : 10,
		borderTopWidth: 1,
		gap: 10,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 8,
	},
	pendingFilesRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		marginBottom: 10,
	},
	pendingFileChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 12,
		gap: 12,
		maxWidth: '100%',
		minHeight: 56,
	},
	pendingFileIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 8,
		backgroundColor: 'rgba(0,0,0,0.06)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	pendingFileTextWrap: {
		flex: 1,
		minWidth: 0,
	},
	pendingFileLabel: {
		...typography.body,
		fontSize: 15,
	},
	pendingFileSize: {
		...typography.bodySmall,
		marginTop: 2,
		fontSize: 12,
	},
	pendingFileRemove: {
		padding: 4,
	},
	inputInnerRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 8,
	},
	attachBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
	},
	input: {
		flex: 1,
		minHeight: 40,
		maxHeight: 100,
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 16,
		borderWidth: 1,
	},
	sendBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default TeamChatScreen;
