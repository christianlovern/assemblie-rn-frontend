import React from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	StyleSheet,
	Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { typography } from '../../shared/styles/typography';
import { useTheme } from '../../contexts/ThemeContext';

const AppHeader = ({ onMenuPress, onChatPress, onLogoPress, unreadCount = 0 }) => {
	const { colors } = useTheme();
	const showBadge = unreadCount > 0;

	return (
		<View style={styles.header}>
			<View style={styles.leftSection}>
				<TouchableOpacity
					onPress={onLogoPress}
					style={styles.logoButton}
					activeOpacity={0.7}
					disabled={!onLogoPress}
					accessibilityLabel="Go to home"
					accessibilityRole="button">
					<Image
						source={require('../../assets/Icon_Primary.png')}
						style={styles.logo}
						resizeMode='contain'
					/>
					<Text style={[styles.logoText, { color: colors.text }]}>
						Assemblie
					</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.rightSection}>
				{onChatPress ? (
					<TouchableOpacity
						onPress={onChatPress}
						style={styles.iconButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						accessibilityLabel={showBadge ? `${unreadCount} unread messages` : 'Chat'}
						accessibilityRole='button'>
						<Icon name='chat-outline' size={24} color={colors.text} />
						{showBadge && (
							<View style={[styles.badge, { backgroundColor: colors.warning || '#AD4343' }]}>
								<Text style={styles.badgeText}>
									{unreadCount > 99 ? '99+' : unreadCount}
								</Text>
							</View>
						)}
					</TouchableOpacity>
				) : null}
				<TouchableOpacity
					onPress={onMenuPress}
					style={styles.menuButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<Icon name='menu' size={28} color={colors.text} />
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 12,
		paddingTop: Platform.OS === 'ios' ? 50 : 12,
		backgroundColor: 'transparent',
		zIndex: 1000,
	},
	leftSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	logoButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	logo: {
		width: 32,
		height: 32,
		marginRight: 10,
	},
	logoText: {
		...typography.h2,
		fontWeight: 'bold',
		fontSize: 20,
	},
	rightSection: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	iconButton: {
		padding: 4,
		position: 'relative',
	},
	badge: {
		position: 'absolute',
		top: -2,
		right: -2,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	badgeText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '700',
	},
	menuButton: {
		padding: 4,
	},
});

export default AppHeader;
