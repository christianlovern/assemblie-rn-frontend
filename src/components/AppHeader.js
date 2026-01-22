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

const AppHeader = ({ onMenuPress }) => {
	const { colors, toggleColorMode, colorMode } = useTheme();

	return (
		<View style={styles.header}>
			<View style={styles.leftSection}>
				<Image
					source={require('../../assets/Icon_Primary.png')}
					style={styles.logo}
					resizeMode="contain"
				/>
				<Text style={[styles.logoText, { color: colors.text }]}>
					Assemblie
				</Text>
			</View>
			<View style={styles.rightSection}>
				<TouchableOpacity
					onPress={toggleColorMode}
					style={styles.themeButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<Icon
						name={colorMode === 'light' ? 'moon-waxing-crescent' : 'white-balance-sunny'}
						size={24}
						color={colors.text}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onMenuPress}
					style={styles.menuButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<Icon name="menu" size={28} color={colors.text} />
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
	themeButton: {
		padding: 4,
	},
	menuButton: {
		padding: 4,
	},
});

export default AppHeader;

