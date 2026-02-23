import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	ScrollView,
	Image,
	Modal,
	Pressable,
	TouchableOpacity,
	Platform,
	Linking,
	Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const DEFAULT_AVATAR = require('../../assets/Assemblie_DefaultUserIcon.png');

const StaffDetailDrawer = ({ visible, onRequestClose, staffMember }) => {
	const { organization } = useData();
	const { colors } = useTheme();
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));

	useEffect(() => {
		if (visible) {
			slideAnim.setValue(0);
			backdropOpacity.setValue(0);
			requestAnimationFrame(() => {
				Animated.parallel([
					Animated.timing(slideAnim, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(backdropOpacity, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
				]).start();
			});
		} else {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible]);

	const screenWidth = Dimensions.get('window').width;
	const drawerWidth = screenWidth * 0.85;
	const translateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerWidth, 0],
	});

	if (!staffMember) return null;

	const user = staffMember.user || staffMember;
	const name = user.firstName && user.lastName
		? `${user.firstName} ${user.lastName}`
		: user.name || 'Staff';
	const email = user.email || user.emailAddress || staffMember.email || '';
	const description = staffMember.description || staffMember.bio || staffMember.title || '';
	const imageUri = user.userPhoto || user.photoUrl || staffMember.imageUrl || staffMember.photoUrl || staffMember.image || '';

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={onRequestClose}>
			<View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
				<Animated.View
					style={[styles.backdrop, { opacity: backdropOpacity }]}
					pointerEvents={visible ? 'auto' : 'none'}>
					<Pressable style={styles.backdropPressable} onPress={onRequestClose} />
				</Animated.View>
				<Animated.View
					style={[
						styles.drawer,
						{
							transform: [{ translateX }],
							backgroundColor: colors.background || '#1A1A1A',
						},
					]}
					pointerEvents={visible ? 'auto' : 'none'}>
					<View style={[styles.drawerHeader, { borderBottomColor: colors.border || 'rgba(255,255,255,0.1)' }]}>
						<Text style={[styles.drawerTitle, { color: colors.text }]} numberOfLines={1}>
							Staff Details
						</Text>
						<TouchableOpacity onPress={onRequestClose} style={styles.closeButton}>
							<Icon name="close" size={28} color={colors.text} />
						</TouchableOpacity>
					</View>

					<ScrollView
						style={styles.scrollView}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}>
						<View style={styles.contentContainer}>
							<Image
								source={imageUri && imageUri.trim() ? { uri: imageUri } : DEFAULT_AVATAR}
								style={styles.coverImage}
								resizeMode="cover"
							/>
							<Text style={[styles.name, { color: colors.text }]}>
								{name}
							</Text>
							{email ? (
								<TouchableOpacity
									onPress={() => Linking.openURL(`mailto:${email}`)}
									style={styles.emailRow}
									activeOpacity={0.7}>
									<Icon name="email-outline" size={20} color={colors.primary || organization?.primaryColor} />
									<Text style={[styles.email, { color: colors.primary || organization?.primaryColor }]}>
										{email}
									</Text>
								</TouchableOpacity>
							) : null}
							{description ? (
								<Text style={[styles.description, { color: colors.text }]}>
									{description}
								</Text>
							) : (
								<Text style={[styles.description, { color: colors.textSecondary }]}>
									No description provided.
								</Text>
							)}
						</View>
					</ScrollView>
				</Animated.View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	backdropPressable: {
		flex: 1,
	},
	drawer: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: '85%',
		maxWidth: 400,
		shadowColor: '#000',
		shadowOffset: { width: -2, height: 0 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	drawerHeader: {
		paddingTop: Platform.OS === 'ios' ? 50 : 20,
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	drawerTitle: {
		...typography.h3,
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
		marginRight: 12,
	},
	closeButton: {
		padding: 4,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	contentContainer: {
		padding: 20,
	},
	coverImage: {
		width: '100%',
		height: 200,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginBottom: 20,
	},
	name: {
		...typography.h2,
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 12,
		lineHeight: 32,
	},
	emailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 16,
	},
	email: {
		...typography.body,
		fontSize: 16,
		flex: 1,
	},
	description: {
		...typography.body,
		fontSize: 16,
		lineHeight: 24,
	},
});

export default StaffDetailDrawer;
