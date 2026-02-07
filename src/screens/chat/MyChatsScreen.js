import React from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const MyChatsScreen = () => {
	const navigation = useNavigation();
	const { teams, user, organization } = useData();
	const { colors } = useTheme();

	if (!user || !organization) return null;

	const teamList = teams || [];

	const renderTeam = ({ item: team }) => (
		<TouchableOpacity
			style={[styles.teamRow, { backgroundColor: colors.background }]}
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
			</View>
			<Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
				{team.name || `Team ${team.id}`}
			</Text>
			<Icon name="chevron-right" size={24} color={colors.textSecondary} />
		</TouchableOpacity>
	);

	if (teamList.length === 0) {
		return (
			<View style={[styles.empty, { backgroundColor: colors.background }]}>
				<Icon name="chat-outline" size={64} color={colors.textSecondary} />
				<Text style={[styles.emptyTitle, { color: colors.text }]}>
					My Chats
				</Text>
				<Text style={[styles.emptySub, { color: colors.textSecondary }]}>
					You’re not in any teams yet. Join a team from My Teams to see chats here.
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.header, { color: colors.text }]}>My Chats</Text>
			<Text style={[styles.subheader, { color: colors.textSecondary }]}>
				Tap a team to open its chat
			</Text>
			<FlatList
				data={teamList}
				keyExtractor={(item) => String(item.id)}
				renderItem={renderTeam}
				contentContainerStyle={styles.list}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	header: {
		...typography.h3,
		marginBottom: 4,
	},
	subheader: {
		...typography.body,
		marginBottom: 16,
	},
	list: {
		paddingBottom: 24,
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
	},
	teamName: {
		...typography.bodyMedium,
		flex: 1,
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
});

export default MyChatsScreen;
