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
	Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';
import { Linking, Alert } from 'react-native';

const UserDetailDrawer = ({ visible, onRequestClose, user, formatPhoneNumber }) => {
	const { organization } = useData();
	const { colors, colorMode } = useTheme();
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));

	useEffect(() => {
		if (visible) {
			// Reset to starting position first (off screen)
			slideAnim.setValue(0);
			backdropOpacity.setValue(0);
			// Use requestAnimationFrame to ensure the drawer is rendered before animating
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
			// Animate out
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

	const screenHeight = Dimensions.get('window').height;
	const drawerHeight = screenHeight * 0.6;
	const translateY = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerHeight, 0], // Slide from bottom (off screen) to visible
	});

	const handlePhonePress = (phoneNumber) => {
		// Clean the phone number to only include digits
		const cleanNumber = phoneNumber.replace(/\D/g, '');

		// Format for tel: URI scheme
		const telUrl = `tel:${cleanNumber}`;

		// Check if linking can open the URL first
		Linking.canOpenURL(telUrl)
			.then((supported) => {
				if (!supported) {
					Alert.alert(
						'Error',
						'Phone calls are not supported on this device'
					);
					return;
				}
				return Linking.openURL(telUrl);
			})
			.catch((err) => {
				console.error('Error opening phone app:', err);
				Alert.alert('Error', 'Could not open phone app');
			});
	};

	if (!user) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={onRequestClose}>
			<View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
				<Animated.View
					style={[
						styles.backdrop,
						{
							opacity: backdropOpacity,
						},
					]}
					pointerEvents={visible ? 'auto' : 'none'}>
					<Pressable
						style={styles.backdropPressable}
						onPress={onRequestClose}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.drawer,
						{
							height: drawerHeight,
							transform: [{ translateY }],
							backgroundColor: colors.background || '#1A1A1A',
						},
					]}
					pointerEvents={visible ? 'auto' : 'none'}>
					{/* Header */}
					<View style={styles.drawerHeader}>
						<View style={styles.headerContent}>
							<Image
								source={
									user?.userPhoto
										? { uri: user.userPhoto }
										: require('../../assets/Assemblie_DefaultUserIcon.png')
								}
								style={styles.userPhoto}
							/>
							<View style={styles.headerTextContainer}>
								<Text
									style={[styles.drawerTitle, { color: colors.text }]}
									numberOfLines={1}>
									{user ? `${user.firstName} ${user.lastName}` : ''}
								</Text>
								{user?.isTeamLead && (
									<Text style={[styles.teamLeadText, { color: colors.textSecondary }]}>
										Team Lead
									</Text>
								)}
							</View>
						</View>
						<TouchableOpacity
							onPress={onRequestClose}
							style={styles.closeButton}>
							<Icon name="close" size={28} color={colors.text} />
						</TouchableOpacity>
					</View>

					<ScrollView
						style={styles.scrollView}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}>
						{/* Content */}
						<View style={styles.contentContainer}>
							{/* Phone Number - only show if visibility is public */}
							{user?.visibilityStatus === 'public' && user?.phoneNumber && (
								<TouchableOpacity
									onPress={() => handlePhonePress(user.phoneNumber)}
									style={styles.infoRow}>
									<View style={[styles.iconContainer, { backgroundColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
										<Icon
											name="phone"
											size={24}
											color={colors.primary || organization.primaryColor}
										/>
									</View>
									<Text style={[styles.infoText, { color: colors.text }]}>
										{formatPhoneNumber ? formatPhoneNumber(user.phoneNumber) : user.phoneNumber}
									</Text>
								</TouchableOpacity>
							)}

							{/* Email - only show if visibility is public */}
							{user?.visibilityStatus === 'public' && user?.email && (
								<View style={styles.infoRow}>
									<View style={[styles.iconContainer, { backgroundColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
										<Icon
											name="email"
											size={24}
											color={colors.primary || organization.primaryColor}
										/>
									</View>
									<Text style={[styles.infoText, { color: colors.text }]}>
										{user.email}
									</Text>
								</View>
							)}

							{/* Show message if no public information available */}
							{user?.visibilityStatus !== 'public' && (
								<View style={styles.emptyStateContainer}>
									<Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
										Contact information is private
									</Text>
								</View>
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
		left: 0,
		right: 0,
		bottom: 0,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	drawerHeader: {
		paddingTop: Platform.OS === 'ios' ? 50 : 20,
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		marginRight: 12,
	},
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	headerTextContainer: {
		flex: 1,
	},
	drawerTitle: {
		...typography.h3,
		fontSize: 20,
		fontWeight: '600',
	},
	teamLeadText: {
		...typography.bodyMedium,
		fontSize: 14,
		marginTop: 4,
	},
	closeButton: {
		padding: 4,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	contentContainer: {
		padding: 20,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	infoText: {
		...typography.body,
		fontSize: 16,
		flex: 1,
	},
	emptyStateContainer: {
		padding: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyStateText: {
		...typography.body,
		fontSize: 16,
		textAlign: 'center',
	},
});

export default UserDetailDrawer;
