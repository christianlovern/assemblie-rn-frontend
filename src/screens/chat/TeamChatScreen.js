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
} from 'react-native';
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
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const PAGE_SIZE = 50;
const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const EMPTY_LIST_MIN_HEIGHT = WINDOW_HEIGHT - 220;
/** Reserve space so the message list doesn't sit under the input bar. */
const INPUT_BAR_RESERVED_HEIGHT = 160;

/** Renders a single attachment: image preview for image/*, file chip otherwise. */
function MessageAttachment({ teamId, messageId, att, isOwn, colors, onPress }) {
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
			activeOpacity={0.7}>
			<Icon
				name='file-outline'
				size={14}
				color={isOwn ? '#fff' : colors.text}
			/>
			<Text
				style={[
					styles.attachmentLabel,
					{ color: isOwn ? '#fff' : colors.text },
				]}
				numberOfLines={1}>
				{att.originalName || 'File'}
				{att.fileSize != null
					? ` (${formatFileSize(att.fileSize)})`
					: ''}
			</Text>
		</TouchableOpacity>
	);
}

const TeamChatScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const { teamId, teamName } = route.params || {};
	const { user, organization } = useData();
	const { colors } = useTheme();

	const [messages, setMessages] = useState([]);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [sending, setSending] = useState(false);
	const [inputText, setInputText] = useState('');
	const [loadingMore, setLoadingMore] = useState(false);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
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
		setSending(true);
		setInputText('');
		setPendingFiles([]);
		try {
			const newMsg = await teamChatApi.sendMessage(teamId, {
				content: content || '',
				files,
			});
			setMessages((prev) => [newMsg, ...prev]);
		} catch (err) {
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
			if (url) await Linking.openURL(url);
		} catch (err) {
			const msg =
				err.response?.data?.message ||
				err.response?.data?.error ||
				'Failed to open file';
			Alert.alert('Error', msg);
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
				<View
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
				</View>
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
						<View style={styles.listWrap}>
							<FlatList
								ref={listRef}
								data={messages}
								keyExtractor={(item) => String(item.id)}
								renderItem={renderMessage}
								inverted
								onScrollBeginDrag={Keyboard.dismiss}
								contentContainerStyle={[
									styles.listContent,
									messages.length === 0 &&
										styles.listContentEmpty,
									{ paddingBottom: 16 },
								]}
								ListEmptyComponent={renderEmpty}
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
													{ color: colors.primary },
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
												{ color: colors.textSecondary },
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
		paddingTop: Platform.OS === 'ios' ? 50 : 12,
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
		paddingBottom: INPUT_BAR_RESERVED_HEIGHT,
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
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 8,
		gap: 6,
		maxWidth: '100%',
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
	messageFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: 4,
		gap: 8,
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
