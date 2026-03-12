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
import { useRoute, useNavigation } from '@react-navigation/native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import {
	directMessageApi,
	DM_MAX_CONTENT_LENGTH,
	DM_MAX_FILES,
	DM_MAX_FILE_BYTES,
} from '../../../api/directMessageRoutes';
import { isAllowedMime } from '../../../api/teamChatRoutes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DMMessageAttachment from './DMMessageAttachment';
import LinkableText from '../../../shared/components/LinkableText';

const PAGE_SIZE = 50;
const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const EMPTY_LIST_MIN_HEIGHT = WINDOW_HEIGHT - 220;
const INPUT_BAR_RESERVED_HEIGHT = 72;
/** Extra space when pending attachment chips are shown (one row + margin). */
const PENDING_FILES_ROW_HEIGHT = 76;

/** Reaction types and icons (same as team chat / backend). */
const REACTION_TYPES = [
	{ type: 'heart', icon: 'heart' },
	{ type: 'thumbsup', icon: 'thumb-up' },
	{ type: 'thumbsdown', icon: 'thumb-down' },
	{ type: 'laugh', icon: 'emoticon-happy-outline' },
	{ type: 'sad', icon: 'emoticon-sad-outline' },
	{ type: 'angry', icon: 'emoticon-angry-outline' },
];

function formatFileSize(bytes) {
	if (bytes == null || bytes < 1024) return `${bytes || 0} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DirectMessageScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { user } = useData();
	const { colors } = useTheme();
	const { conversationId, otherUser: routeOtherUser } = route.params || {};

	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [inputText, setInputText] = useState('');
	const [sending, setSending] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
	const [reactionActionLoading, setReactionActionLoading] = useState(false);
	const [attachmentViewer, setAttachmentViewer] = useState(null);
	const [attachmentDownloading, setAttachmentDownloading] = useState(false);
	const listRef = useRef(null);

	const otherUser = routeOtherUser || {};

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

	const formatTime = (iso) => {
		if (!iso) return '';
		try {
			const d = new Date(iso);
			const now = new Date();
			const isToday = d.toDateString() === now.toDateString();
			if (isToday) {
				return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
			}
			return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		} catch {
			return '';
		}
	};

	const loadMessages = useCallback(
		async (before = null, append = false) => {
			if (!conversationId) return;
			try {
				if (!append) setLoading(true);
				else setLoadingMore(true);
				const data = await directMessageApi.getMessages(conversationId, {
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
				if (err.response?.status === 403 || err.response?.status === 404) {
					Alert.alert('Error', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
					return;
				}
				Alert.alert('Error', msg);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[conversationId, navigation],
	);

	const refresh = useCallback(() => {
		setRefreshing(true);
		loadMessages(null, false).finally(() => setRefreshing(false));
	}, [loadMessages]);

	useEffect(() => {
		if (conversationId) loadMessages();
	}, [conversationId, loadMessages]);

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
		if (!conversationId || sending) return;
		if (!content && (!files || files.length === 0)) return;
		setSending(true);
		setInputText('');
		setPendingFiles([]);
		try {
			const res = await directMessageApi.sendMessage(conversationId, {
				content: content || '',
				files,
			});
			let newMsg = res?.message;
			// If we sent files but the backend returns empty content and no attachments, show an optimistic message with our files
			if (files?.length && newMsg && !(newMsg.content && newMsg.content.trim()) && !(newMsg.attachments && newMsg.attachments.length > 0)) {
				newMsg = {
					...newMsg,
					content: '',
					attachments: files.map((f, i) => ({
						id: newMsg.id ? `opt-${newMsg.id}-${i}` : `opt-${Date.now()}-${i}`,
						originalName: f.name,
						mimeType: f.mimeType,
						url: null,
					})),
				};
			}
			// If backend returned no message but we sent files, show optimistic local message
			if (!newMsg && files?.length) {
				newMsg = {
					id: `local-${Date.now()}`,
					content: '',
					senderId: user?.id,
					createdAt: new Date().toISOString(),
					attachments: files.map((f, i) => ({
						id: `local-att-${Date.now()}-${i}`,
						originalName: f.name,
						mimeType: f.mimeType,
						url: null,
					})),
				};
			}
			if (newMsg) setMessages((prev) => [newMsg, ...prev]);
		} catch (err) {
			const data = err.response?.data;
			const msg =
				(data && (data.message || data.error || data.errors?.[0])) ||
				err.message ||
				'Failed to send message';
			const status = err.response?.status;
			Alert.alert(
				'Error sending message',
				status ? `${msg} (${status})` : msg,
			);
			setInputText(content);
			if (files?.length) setPendingFiles(files);
		} finally {
			setSending(false);
		}
	};

	useEffect(() => {
		navigation.setOptions({ headerShown: false });
	}, [navigation]);

	const pickFromLibrary = async () => {
		const canAdd = DM_MAX_FILES - pendingFiles.length;
		if (canAdd <= 0) {
			Alert.alert('Limit', `You can attach up to ${DM_MAX_FILES} files per message.`);
			return;
		}
		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission needed', 'Allow access to your photos and videos to attach them.');
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
				if (a.fileSize != null && a.fileSize > DM_MAX_FILE_BYTES) {
					Alert.alert('File too large', `${a.fileName || a.name || 'Media'} is over 25 MB.`);
					continue;
				}
				const mimeType = a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg');
				if (!isAllowedMime(mimeType)) {
					Alert.alert('File type not allowed', `${a.fileName || a.name || 'File'} type is not supported.`);
					continue;
				}
				const fileName = a.fileName || a.name || (a.type === 'video' ? 'video.mp4' : 'image.jpg');
				toAdd.push({ uri: a.uri, name: fileName, mimeType, size: a.fileSize });
			}
			setPendingFiles((prev) => [...prev, ...toAdd].slice(0, DM_MAX_FILES));
		} catch (e) {
			Alert.alert('Error', e?.message || 'Failed to pick from library');
		}
	};

	const pickDocuments = async () => {
		const canAdd = DM_MAX_FILES - pendingFiles.length;
		if (canAdd <= 0) {
			Alert.alert('Limit', `You can attach up to ${DM_MAX_FILES} files per message.`);
			return;
		}
		try {
			const result = await DocumentPicker.getDocumentAsync({
				multiple: canAdd > 1,
				copyToCacheDirectory: true,
				type: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.ms-excel', 'text/plain', 'text/csv'],
			});
			if (result.canceled) return;
			const assets = result.assets || [];
			const toAdd = [];
			for (const a of assets) {
				if (toAdd.length >= canAdd) break;
				if (a.size != null && a.size > DM_MAX_FILE_BYTES) {
					Alert.alert('File too large', `${a.name} is over 25 MB.`);
					continue;
				}
				if (a.mimeType && !isAllowedMime(a.mimeType)) {
					Alert.alert('File type not allowed', `${a.name} type is not supported.`);
					continue;
				}
				toAdd.push({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
			}
			setPendingFiles((prev) => [...prev, ...toAdd].slice(0, DM_MAX_FILES));
		} catch (e) {
			Alert.alert('Error', e?.message || 'Failed to pick files');
		}
	};

	const pickAttachments = () => {
		const canAdd = DM_MAX_FILES - pendingFiles.length;
		if (canAdd <= 0) {
			Alert.alert('Limit', `You can attach up to ${DM_MAX_FILES} files per message.`);
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
			const data = await directMessageApi.getAttachmentDownloadUrl(
				conversationId,
				messageId,
				att.id,
			);
			const url = data?.url;
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
				`dm_${Date.now()}_${safeName}${ext}`,
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
				Alert.alert('Saved', 'File saved to cache.');
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

	const handleReactionSelect = useCallback(
		async (messageId, type) => {
			if (!conversationId || reactionActionLoading) return;
			const message = messages.find((m) => m.id === messageId);
			if (!message) return;
			const reactionEntry = (message.reactions || []).find((r) => r.type === type);
			const hasMine = user?.id && reactionEntry?.userIds?.includes(user.id);
			setReactionActionLoading(true);
			try {
				const updated = hasMine
					? await directMessageApi.removeReaction(conversationId, messageId, type)
					: await directMessageApi.addReaction(conversationId, messageId, type);
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
		[conversationId, messages, user?.id, reactionActionLoading],
	);

	function formatFileSize(bytes) {
		if (bytes == null || bytes < 1024) return `${bytes || 0} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	if (!conversationId) {
		return (
			<View style={[styles.center, { backgroundColor: colors.background }]}>
				<Text style={{ color: colors.text }}>No conversation selected</Text>
			</View>
		);
	}

	const renderMessage = ({ item }) => {
		const isOwn = item.senderId === user?.id;
		const attachments = item.attachments || [];
		const reactions = item.reactions || [];
		return (
			<View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
				<TouchableOpacity
					activeOpacity={1}
					onLongPress={() => setReactionPickerMessageId(item.id)}
					delayLongPress={400}
					style={[
						styles.bubble,
						isOwn
							? { backgroundColor: colors.primary, alignSelf: 'flex-end' }
							: { backgroundColor: colors.textSecondary + '30', alignSelf: 'flex-start' },
					]}>
					<LinkableText
						text={item.content || ''}
						style={[styles.content, { color: isOwn ? '#fff' : colors.text }]}
						linkStyle={{
							color: isOwn ? 'rgba(255,255,255,0.95)' : colors.primary,
							textDecorationLine: 'underline',
						}}
					/>
					{attachments.length > 0 && (
						<View style={styles.attachmentsWrap}>
							{attachments.map((att) => (
								<DMMessageAttachment
									key={att.id}
									conversationId={conversationId}
									messageId={item.id}
									att={att}
									isOwn={isOwn}
									colors={colors}
									onPress={openAttachment}
									onLongPress={() => setReactionPickerMessageId(item.id)}
								/>
							))}
						</View>
					)}
					<View style={styles.messageFooter}>
						<Text
							style={[
								styles.time,
								{ color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
							]}>
							{formatTime(item.createdAt)}
						</Text>
					</View>
					{reactions.length > 0 && (
						<View style={styles.reactionsRow}>
							{reactions.map((r) => {
								const preset = REACTION_TYPES.find((p) => p.type === r.type);
								const icon = preset?.icon || 'emoticon-outline';
								const isMine = user?.id && (r.userIds || []).includes(user.id);
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
														: colors.textSecondary + '18',
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
											color={isOwn ? 'rgba(255,255,255,0.95)' : colors.text}
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
				textAlign="center">
				No messages yet. Say hello!
			</Text>
		</View>
	);

	const otherName = [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') || 'Chat';

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.main}>
				<View
					style={[
						styles.header,
						{ borderBottomColor: colors.textSecondary + '30' },
					]}>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={styles.backBtn}>
						<Icon name="arrow-left" size={24} color={colors.text} />
					</TouchableOpacity>
					<View style={styles.headerTitleRow}>
						<Image
							source={
								otherUser.userPhoto
									? { uri: otherUser.userPhoto }
									: require('../../../assets/Assemblie_DefaultUserIcon.png')
							}
							style={styles.headerAvatar}
						/>
						<Text
							style={[styles.headerTitle, { color: colors.text }]}
							numberOfLines={1}>
							{otherName}
						</Text>
					</View>
				</View>

				{loading ? (
					<View style={styles.loadingWrap}>
						<ActivityIndicator size="large" color={colors.primary} />
					</View>
				) : (
					<View
						style={[
							styles.listWrap,
							{
								paddingBottom:
									INPUT_BAR_RESERVED_HEIGHT +
									(pendingFiles.length > 0 ? PENDING_FILES_ROW_HEIGHT : 0) +
									keyboardHeight,
							},
						]}>
						{messages.length === 0 ? (
							<View
								style={[
									styles.listContent,
									styles.listContentEmpty,
									{
										paddingBottom:
											INPUT_BAR_RESERVED_HEIGHT +
											(pendingFiles.length > 0 ? PENDING_FILES_ROW_HEIGHT : 0) +
											keyboardHeight,
										flexGrow: 1,
									},
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
											(pendingFiles.length > 0 ? PENDING_FILES_ROW_HEIGHT : 0) +
											keyboardHeight +
											insets.bottom,
									},
								]}
								keyboardShouldPersistTaps="handled"
								keyboardDismissMode="on-drag"
								refreshControl={
									<RefreshControl
										refreshing={refreshing}
										onRefresh={refresh}
										tintColor={colors.primary}
									/>
								}
								ListFooterComponent={
									loadingMore ? (
										<ActivityIndicator
											size="small"
											color={colors.primary}
											style={styles.loadMoreSpinner}
										/>
									) : hasMore ? (
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
									) : null
								}
							/>
						)}
					</View>
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
									{ backgroundColor: colors.textSecondary + '25' },
								]}>
								<View style={styles.pendingFileIconWrap}>
									<Icon name="file-document-outline" size={28} color={colors.primary} />
								</View>
								<View style={styles.pendingFileTextWrap}>
									<Text
										style={[styles.pendingFileLabel, { color: colors.text }]}
										numberOfLines={2}>
										{f.name || 'File'}
									</Text>
									{f.size != null && (
										<Text
											style={[styles.pendingFileSize, { color: colors.textSecondary }]}>
											{formatFileSize(f.size)}
										</Text>
									)}
								</View>
								<TouchableOpacity
									style={styles.pendingFileRemove}
									hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
									onPress={() => removePendingFile(i)}>
									<Icon name="close-circle" size={24} color={colors.textSecondary} />
								</TouchableOpacity>
							</View>
						))}
					</View>
				)}
				<View style={styles.inputRow}>
					<TouchableOpacity
						style={[
							styles.attachBtn,
							{ backgroundColor: colors.textSecondary + '20' },
						]}
						onPress={pickAttachments}
						disabled={sending || pendingFiles.length >= DM_MAX_FILES}>
						<Icon name="paperclip" size={22} color={colors.text} />
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
						placeholder="Message..."
						placeholderTextColor={colors.textSecondary}
						value={inputText}
						onChangeText={setInputText}
						multiline
						maxLength={DM_MAX_CONTENT_LENGTH}
						editable={!sending}
					/>
					<TouchableOpacity
						style={[styles.sendBtn, { backgroundColor: colors.primary }]}
						onPress={handleSend}
						disabled={
							sending ||
							(!inputText.trim() && pendingFiles.length === 0)
						}>
						{sending ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Icon name="send" size={24} color="#fff" />
						)}
					</TouchableOpacity>
				</View>
			</View>

			{/* Attachment viewer: tap photo to view in modal */}
			<Modal
				visible={Boolean(attachmentViewer)}
				transparent
				animationType="fade"
				onRequestClose={() => setAttachmentViewer(null)}>
				<View style={styles.attachmentModalOverlay}>
					<View style={[styles.attachmentModalContent, { backgroundColor: colors.background }]}>
						<View style={styles.attachmentModalHeader}>
							<Text style={[styles.attachmentModalTitle, { color: colors.text }]} numberOfLines={1}>
								{attachmentViewer?.name || 'Attachment'}
							</Text>
							<TouchableOpacity onPress={() => setAttachmentViewer(null)} style={styles.attachmentModalClose}>
								<Icon name="close" size={28} color={colors.text} />
							</TouchableOpacity>
						</View>
						<ScrollView style={styles.attachmentModalBody} contentContainerStyle={styles.attachmentModalBodyContent} showsVerticalScrollIndicator>
							{attachmentViewer?.mimeType?.startsWith('image/') ? (
								<Image source={{ uri: attachmentViewer.url }} style={styles.attachmentModalImage} resizeMode="contain" />
							) : (
								<View style={styles.attachmentModalFileCard}>
									<Icon name="file-document-outline" size={64} color={colors.primary} />
									<Text style={[styles.attachmentModalFileLabel, { color: colors.text }]} numberOfLines={2}>{attachmentViewer?.name || 'File'}</Text>
									<Text style={[styles.attachmentModalFileHint, { color: colors.textSecondary }]}>Use Download to save or open in another app</Text>
								</View>
							)}
						</ScrollView>
						<View style={[styles.attachmentModalFooter, { borderTopColor: colors.textSecondary + '30' }]}>
							<TouchableOpacity style={[styles.attachmentModalDownloadBtn, { backgroundColor: colors.primary }]} onPress={downloadAttachment} disabled={attachmentDownloading}>
								{attachmentDownloading ? <ActivityIndicator size="small" color="#fff" /> : (<><Icon name="download" size={22} color="#fff" /><Text style={styles.attachmentModalDownloadLabel}>Download</Text></>)}
							</TouchableOpacity>
							{!attachmentViewer?.mimeType?.startsWith('image/') && (
								<TouchableOpacity style={[styles.attachmentModalOpenBtn, { borderColor: colors.primary }]} onPress={async () => { if (attachmentViewer?.url) await Linking.openURL(attachmentViewer.url); }}>
									<Icon name="open-in-new" size={20} color={colors.primary} />
									<Text style={[styles.attachmentModalOpenLabel, { color: colors.primary }]}>Open externally</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</Modal>

			{/* Reaction picker: long-press message to add/remove reaction */}
			<Modal
				visible={Boolean(reactionPickerMessageId)}
				transparent
				animationType="fade"
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
								backgroundColor: colors.cardBackground || colors.background,
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
								const reactionEntry = (message?.reactions || []).find(
									(r) => r.type === type,
								);
								const hasMine =
									user?.id && reactionEntry?.userIds?.includes(user.id);
								return (
									<TouchableOpacity
										key={type}
										style={[
											styles.reactionPickerIconWrap,
											hasMine && { backgroundColor: colors.primary + '25' },
										]}
										onPress={() =>
											handleReactionSelect(reactionPickerMessageId, type)
										}
										disabled={reactionActionLoading}>
										<Icon
											name={icon}
											size={28}
											color={hasMine ? colors.primary : colors.text}
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

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	main: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	backBtn: {
		padding: 8,
		marginRight: 8,
	},
	headerTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		minWidth: 0,
	},
	headerAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		marginRight: 10,
	},
	headerTitle: {
		...typography.h3,
		flex: 1,
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
	listContentEmpty: {
		flexGrow: 1,
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
	content: {
		...typography.body,
	},
	time: {
		...typography.caption,
		fontSize: 11,
		marginTop: 4,
	},
	messageFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: 4,
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
	attachmentModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	attachmentModalContent: {
		width: '100%',
		maxWidth: 480,
		maxHeight: '90%',
		borderRadius: 16,
		overflow: 'hidden',
	},
	attachmentModalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0,0,0,0.08)',
	},
	attachmentModalTitle: {
		...typography.body,
		fontWeight: '600',
		flex: 1,
		marginRight: 8,
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
	},
	attachmentModalImage: {
		width: Dimensions.get('window').width - 64,
		height: 320,
		borderRadius: 8,
	},
	attachmentModalFileCard: {
		alignItems: 'center',
		paddingVertical: 32,
		paddingHorizontal: 24,
	},
	attachmentModalFileLabel: {
		...typography.body,
		fontWeight: '500',
		marginTop: 12,
		textAlign: 'center',
	},
	attachmentModalFileHint: {
		...typography.caption,
		marginTop: 8,
		textAlign: 'center',
	},
	attachmentModalFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderTopWidth: 1,
	},
	attachmentModalDownloadBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		gap: 8,
	},
	attachmentModalDownloadLabel: {
		...typography.body,
		fontWeight: '600',
		color: '#fff',
	},
	attachmentModalOpenBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		borderWidth: 2,
		gap: 8,
	},
	attachmentModalOpenLabel: {
		...typography.body,
		fontWeight: '600',
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
	attachmentsWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
		marginTop: 8,
	},
	attachmentChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderRadius: 10,
		gap: 8,
		maxWidth: '100%',
	},
	attachmentFileName: {
		...typography.body,
		fontSize: 14,
		flex: 1,
	},
	loadMoreWrap: {
		paddingVertical: 12,
		alignItems: 'center',
	},
	loadMoreText: {
		...typography.caption,
	},
	loadMoreSpinner: {
		marginVertical: 12,
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
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

export default DirectMessageScreen;
