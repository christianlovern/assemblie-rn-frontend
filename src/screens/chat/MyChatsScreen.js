import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Image,
	ActivityIndicator,
	Modal,
	TextInput,
	SafeAreaView,
	Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { useChatUnreadRefresh } from '../../contexts/ChatUnreadContext';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { teamChatApi } from '../../../api/teamChatRoutes';
import { directMessageApi } from '../../../api/directMessageRoutes';

const MyChatsScreen = () => {
	const navigation = useNavigation();
	const { teams, user, organization } = useData();
	const { colors } = useTheme();

	const [teamUnreadCounts, setTeamUnreadCounts] = useState({});
	const [conversations, setConversations] = useState([]);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [loadingDMs, setLoadingDMs] = useState(true);
	const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);
	const [eligibleUsers, setEligibleUsers] = useState([]);
	const [eligibleLoading, setEligibleLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [creatingConversation, setCreatingConversation] = useState(false);
	const refreshUnreadCount = useChatUnreadRefresh();

	if (!user || !organization) return null;

	const teamList = teams || [];

	const fetchTeamUnreadCounts = useCallback(async () => {
		try {
			const data = await teamChatApi.getAllUnreadCounts();
			setTeamUnreadCounts(data.unreadCounts || {});
		} catch {
			setTeamUnreadCounts({});
		} finally {
			setLoadingTeams(false);
		}
	}, []);

	const fetchConversations = useCallback(async () => {
		try {
			const data = await directMessageApi.getConversations();
			const list = data.conversations || [];
			const sorted = [...list].sort((a, b) => {
				const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
				const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
				return bTime - aTime;
			});
			setConversations(sorted);
		} catch {
			setConversations([]);
		} finally {
			setLoadingDMs(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			setLoadingTeams(true);
			setLoadingDMs(true);
			fetchTeamUnreadCounts();
			fetchConversations();
			refreshUnreadCount();
		}, [fetchTeamUnreadCounts, fetchConversations, refreshUnreadCount]),
	);

	const openNewMessageModal = useCallback(async () => {
		setNewMessageModalVisible(true);
		setSearchQuery('');
		setEligibleUsers([]);
		setEligibleLoading(true);
		try {
			const data = await directMessageApi.getEligibleUsers();
			setEligibleUsers(data.users || []);
		} catch {
			setEligibleUsers([]);
		} finally {
			setEligibleLoading(false);
		}
	}, []);

	const filteredEligible = searchQuery.trim()
		? eligibleUsers.filter((u) => {
				const full = [u.firstName, u.lastName, u.email].filter(Boolean).join(' ').toLowerCase();
				return full.includes(searchQuery.trim().toLowerCase());
		  })
		: eligibleUsers;

	const selectUserForDM = useCallback(async (otherUser) => {
		if (creatingConversation || !otherUser?.id) return;
		setCreatingConversation(true);
		try {
			const data = await directMessageApi.createOrGetConversation(otherUser.id);
			const conv = data.conversation;
			setNewMessageModalVisible(false);
			navigation.navigate('DirectMessage', {
				conversationId: conv.id,
				otherUser: conv.otherUser || otherUser,
			});
		} catch (err) {
			const msg =
				err.response?.data?.message ||
				err.response?.data?.error ||
				'Could not start conversation. You can only message users who share a team with you.';
			Alert.alert('Cannot start chat', msg);
		} finally {
			setCreatingConversation(false);
		}
	}, [creatingConversation, navigation]);

	const openConversation = (conv) => {
		navigation.navigate('DirectMessage', {
			conversationId: conv.id,
			otherUser: conv.otherUser,
		});
	};

	const formatPreviewTime = (iso) => {
		if (!iso) return '';
		try {
			const d = new Date(iso);
			const now = new Date();
			const isToday = d.toDateString() === now.toDateString();
			if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
			return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
		} catch {
			return '';
		}
	};

	const renderTeam = ({ item: team }) => {
		const unread = teamUnreadCounts[String(team.id)] || 0;
		const showBadge = unread > 0;
		return (
			<TouchableOpacity
				style={[styles.teamRow, { backgroundColor: colors.cardBackground || colors.background }]}
				onPress={() =>
					navigation.navigate('TeamChat', {
						teamId: team.id,
						teamName: team.name || 'Team Chat',
					})
				}
				activeOpacity={0.7}
			>
				<View style={[styles.iconWrap, { backgroundColor: colors.primary + '30' }]}>
					<Icon name="chat" size={24} color={colors.primary} />
					{showBadge && (
						<View style={[styles.rowBadge, { backgroundColor: colors.warning || '#AD4343' }]}>
							<Text style={styles.rowBadgeText}>{unread > 99 ? '99+' : unread}</Text>
						</View>
					)}
				</View>
				<Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
					{team.name || `Team ${team.id}`}
				</Text>
				<Icon name="chevron-right" size={24} color={colors.textSecondary} />
			</TouchableOpacity>
		);
	};

	const renderConversation = ({ item: conv }) => {
		const other = conv.otherUser || {};
		const name = [other.firstName, other.lastName].filter(Boolean).join(' ') || `User ${other.id}`;
		const last = conv.lastMessage;
		const preview = last?.content ? (last.content.length > 50 ? last.content.slice(0, 50) + '…' : last.content) : 'No messages yet';
		const isFromThem = last && last.senderId !== user?.id;
		return (
			<TouchableOpacity
				style={[styles.dmRow, { backgroundColor: colors.cardBackground || colors.background }]}
				onPress={() => openConversation(conv)}
				activeOpacity={0.7}
			>
				<Image
					source={
						other.userPhoto
							? { uri: other.userPhoto }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.dmAvatar}
				/>
				<View style={styles.dmContent}>
					<View style={styles.dmRowTop}>
						<Text style={[styles.dmName, { color: colors.text }]} numberOfLines={1}>
							{name}
						</Text>
						{last && (
							<Text style={[styles.dmTime, { color: colors.textSecondary }]}>
								{formatPreviewTime(last.createdAt)}
							</Text>
						)}
					</View>
					<Text
						style={[styles.dmPreview, { color: colors.textSecondary }]}
						numberOfLines={1}
					>
						{isFromThem ? '' : 'You: '}{preview}
					</Text>
				</View>
				<Icon name="chevron-right" size={22} color={colors.textSecondary} />
			</TouchableOpacity>
		);
	};

	const hasTeams = teamList.length > 0;
	const hasConversations = conversations.length > 0;
	const isEmpty = !hasTeams && !hasConversations && !loadingTeams && !loadingDMs;

	if (isEmpty) {
		return (
			<View style={[styles.empty, { backgroundColor: colors.background }]}>
				<Icon name="chat-outline" size={64} color={colors.textSecondary} />
				<Text style={[styles.emptyTitle, { color: colors.text }]}>My Chats</Text>
				<Text style={[styles.emptySub, { color: colors.textSecondary }]}>
					You're not in any teams yet. Join a team from My Teams to see team chats and message teammates.
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.headerRow}>
				<View>
					<Text style={[styles.header, { color: colors.text }]}>My Chats</Text>
					<Text style={[styles.subheader, { color: colors.textSecondary }]}>
						Team chats and direct messages
					</Text>
				</View>
				<TouchableOpacity
					style={[styles.newMessageButton, { backgroundColor: colors.primary }]}
					onPress={openNewMessageModal}
				>
					<Icon name="pencil" size={22} color="#fff" />
					<Text style={styles.newMessageButtonText}>New</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={[]}
				keyExtractor={() => 'sections'}
				renderItem={null}
				ListHeaderComponent={
					<>
						{hasTeams && (
							<View style={styles.section}>
								<Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
									Team chats
								</Text>
								{loadingTeams ? (
									<ActivityIndicator size="small" color={colors.primary} style={styles.sectionLoader} />
								) : (
									teamList.map((team) => (
										<View key={String(team.id)}>
											{renderTeam({ item: team })}
										</View>
									))
								)}
							</View>
						)}
						<View style={styles.section}>
							<Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
								Direct messages
							</Text>
							{loadingDMs ? (
								<ActivityIndicator size="small" color={colors.primary} style={styles.sectionLoader} />
							) : conversations.length === 0 ? (
								<Text style={[styles.noDMs, { color: colors.textSecondary }]}>
									No conversations yet. Tap "New" to message someone who shares a team with you.
								</Text>
							) : (
								conversations.map((conv) => (
									<View key={String(conv.id)}>
										{renderConversation({ item: conv })}
									</View>
								))
							)}
						</View>
					</>
				}
				contentContainerStyle={styles.list}
			/>

			<Modal
				visible={newMessageModalVisible}
				animationType="slide"
				transparent
				onRequestClose={() => setNewMessageModalVisible(false)}
			>
				<SafeAreaView style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
					<View style={[styles.modalContent, { backgroundColor: colors.background }]}>
						<View style={styles.modalHeader}>
							<Text style={[styles.modalTitle, { color: colors.text }]}>New message</Text>
							<TouchableOpacity onPress={() => setNewMessageModalVisible(false)}>
								<Icon name="close" size={28} color={colors.text} />
							</TouchableOpacity>
						</View>
						<Text style={[styles.modalHint, { color: colors.textSecondary }]}>
							Search for someone who shares a team with you
						</Text>
						<TextInput
							style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
							placeholder="Name or email..."
							placeholderTextColor={colors.textSecondary}
							value={searchQuery}
							onChangeText={setSearchQuery}
							autoCapitalize="none"
							autoCorrect={false}
						/>
						{eligibleLoading ? (
							<ActivityIndicator size="large" color={colors.primary} style={styles.modalLoader} />
						) : (
							<FlatList
								data={filteredEligible}
								keyExtractor={(item) => String(item.id)}
								renderItem={({ item: u }) => {
									const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || `User ${u.id}`;
									return (
										<TouchableOpacity
											style={[styles.userRow, { borderBottomColor: colors.border }]}
											onPress={() => selectUserForDM(u)}
											disabled={creatingConversation}
										>
											<Image
												source={
													u.userPhoto
														? { uri: u.userPhoto }
														: require('../../../assets/Assemblie_DefaultUserIcon.png')
												}
												style={styles.userRowAvatar}
											/>
											<Text style={[styles.userRowName, { color: colors.text }]} numberOfLines={1}>
												{name}
											</Text>
											{creatingConversation ? (
												<ActivityIndicator size="small" color={colors.primary} />
											) : (
												<Icon name="chevron-right" size={22} color={colors.textSecondary} />
											)}
										</TouchableOpacity>
									);
								}}
								contentContainerStyle={styles.userList}
								ListEmptyComponent={
									<Text style={[styles.noUsers, { color: colors.textSecondary }]}>
										{eligibleUsers.length === 0
											? 'No one to message yet. Join a team to message teammates.'
											: 'No matches for your search.'}
									</Text>
								}
							/>
						)}
					</View>
				</SafeAreaView>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 16,
	},
	header: {
		...typography.h3,
		marginBottom: 4,
	},
	subheader: {
		...typography.body,
	},
	newMessageButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 20,
		gap: 6,
	},
	newMessageButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 15,
	},
	list: {
		paddingBottom: 24,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		...typography.bodyMedium,
		fontSize: 13,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 10,
	},
	sectionLoader: {
		marginVertical: 12,
	},
	teamRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderRadius: 12,
		marginBottom: 8,
	},
	iconWrap: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
		position: 'relative',
	},
	rowBadge: {
		position: 'absolute',
		top: -4,
		right: -4,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 5,
	},
	rowBadgeText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '700',
	},
	teamName: {
		...typography.bodyMedium,
		flex: 1,
	},
	dmRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 12,
		marginBottom: 6,
	},
	dmAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 12,
	},
	dmContent: {
		flex: 1,
		minWidth: 0,
	},
	dmRowTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 2,
	},
	dmName: {
		...typography.bodyMedium,
		fontSize: 16,
		flex: 1,
	},
	dmTime: {
		fontSize: 12,
	},
	dmPreview: {
		fontSize: 14,
	},
	noDMs: {
		fontSize: 14,
		paddingVertical: 12,
		paddingHorizontal: 4,
	},
	empty: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
	},
	emptyTitle: {
		...typography.h3,
		marginTop: 16,
		marginBottom: 8,
	},
	emptySub: {
		...typography.body,
		textAlign: 'center',
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalContent: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '85%',
		paddingHorizontal: 20,
		paddingBottom: 24,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 16,
	},
	modalTitle: {
		...typography.h3,
		fontSize: 20,
	},
	modalHint: {
		fontSize: 14,
		marginBottom: 12,
	},
	searchInput: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 16,
		marginBottom: 16,
	},
	modalLoader: {
		marginVertical: 24,
	},
	userList: {
		paddingBottom: 24,
	},
	userRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
	userRowAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		marginRight: 12,
	},
	userRowName: {
		...typography.body,
		flex: 1,
		fontSize: 16,
	},
	noUsers: {
		fontSize: 15,
		paddingVertical: 20,
		textAlign: 'center',
	},
});

export default MyChatsScreen;
