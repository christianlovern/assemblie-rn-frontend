import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Modal,
	Pressable,
	TouchableOpacity,
	Platform,
	Dimensions,
	ScrollView,
	Image,
	Linking,
	Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Drawer showing a checked-in member's details and notes (for team leads).
 * checkInItem: raw check-in record with User or FamilyMember or attendee, and optional notes.
 */
const CheckInMemberDrawer = ({
	visible,
	onRequestClose,
	checkInItem,
	formatPhoneNumber,
}) => {
	const { colors, colorMode } = useTheme();
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

	const translateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [screenWidth, 0],
	});

	if (!checkInItem) return null;

	let name = '';
	let photo = null;
	let phoneNumber = '';
	let notes = null;
	let checkInTime = checkInItem.checkInTime || checkInItem.checkedInAt || null;

	if (checkInItem.User) {
		name = `${checkInItem.User.firstName || ''} ${checkInItem.User.lastName || ''}`.trim();
		photo = checkInItem.User.userPhoto;
		phoneNumber = checkInItem.User.phoneNumber || '';
		notes = checkInItem.User.notes ?? null;
	} else if (checkInItem.FamilyMember) {
		const fm = checkInItem.FamilyMember;
		name = `${fm.firstName || ''} ${fm.lastName || ''}`.trim();
		photo = fm.userPhoto;
		phoneNumber = fm.creator?.phoneNumber || '';
		notes = fm.notes ?? checkInItem.notes ?? null;
	} else if (checkInItem.attendee) {
		const a = checkInItem.attendee;
		name = `${a.firstName || ''} ${a.lastName || ''}`.trim();
		photo = a.userPhoto;
		phoneNumber = checkInItem.User?.phoneNumber || a.phoneNumber || '';
		notes = a.notes ?? checkInItem.notes ?? null;
	} else if (checkInItem.firstName != null || checkInItem.notes != null) {
		// Flat shape: check-in item is the family member (e.g. from ministry check-ins API)
		name = `${checkInItem.firstName || ''} ${checkInItem.lastName || ''}`.trim();
		photo = checkInItem.userPhoto;
		phoneNumber = checkInItem.creator?.phoneNumber || checkInItem.phoneNumber || '';
		notes = checkInItem.notes ?? null;
	}

	const displayPhone = phoneNumber ? (formatPhoneNumber ? formatPhoneNumber(phoneNumber) : phoneNumber) : '';
	const handlePhonePress = () => {
		if (!phoneNumber) return;
		const clean = phoneNumber.replace(/\D/g, '');
		const telUrl = `tel:${clean}`;
		Linking.canOpenURL(telUrl).then((supported) => {
			if (supported) Linking.openURL(telUrl);
			else Alert.alert('Error', 'Phone calls are not supported on this device');
		}).catch(() => Alert.alert('Error', 'Could not open phone app'));
	};

	const formatTime = (iso) => {
		if (!iso) return null;
		try {
			const d = new Date(iso);
			return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		} catch {
			return null;
		}
	};

	const timeStr = formatTime(checkInTime);
	const textColor = colors.text || '#fff';
	const secondaryColor = colors.textSecondary || 'rgba(255,255,255,0.7)';

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
					<View style={[styles.drawerHeader, { borderBottomColor: secondaryColor }]}>
						<Text style={[styles.drawerTitle, { color: textColor }]} numberOfLines={1}>
							Check-in details
						</Text>
						<TouchableOpacity onPress={onRequestClose} style={styles.closeButton}>
							<Icon name="close" size={28} color={textColor} />
						</TouchableOpacity>
					</View>
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}>
						<View style={styles.photoRow}>
							<Image
								source={
									photo
										? { uri: photo }
										: require('../../assets/Assemblie_DefaultUserIcon.png')
								}
								style={styles.avatar}
							/>
							<View style={styles.nameBlock}>
								<Text style={[styles.name, { color: textColor }]}>{name || 'Unknown'}</Text>
								{timeStr && (
									<Text style={[styles.time, { color: secondaryColor }]}>
										Checked in at {timeStr}
									</Text>
								)}
							</View>
						</View>
						{displayPhone ? (
							<TouchableOpacity
								style={[styles.row, { borderBottomColor: secondaryColor }]}
								onPress={handlePhonePress}>
								<Icon name="phone" size={22} color={colors.primary || textColor} />
								<Text style={[styles.rowText, { color: textColor }]}>{displayPhone}</Text>
								<Icon name="chevron-right" size={20} color={secondaryColor} />
							</TouchableOpacity>
						) : null}
						<View style={[styles.notesSection, { borderTopColor: secondaryColor }]}>
							<Text style={[styles.notesLabel, { color: textColor }]}>Notes</Text>
							<Text style={[styles.notesText, { color: textColor }]}>
								{notes && notes.trim() ? notes.trim() : 'No notes for this member.'}
							</Text>
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
		shadowRadius: 4,
		elevation: 8,
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
		padding: 20,
		paddingBottom: 40,
	},
	photoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	avatar: {
		width: 72,
		height: 72,
		borderRadius: 36,
		marginRight: 16,
	},
	nameBlock: {
		flex: 1,
	},
	name: {
		...typography.h3,
		fontSize: 20,
		marginBottom: 4,
	},
	time: {
		...typography.body,
		fontSize: 14,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
	rowText: {
		...typography.body,
		flex: 1,
		marginLeft: 12,
	},
	notesSection: {
		marginTop: 24,
		paddingTop: 20,
		borderTopWidth: 1,
	},
	notesLabel: {
		...typography.h3,
		fontSize: 16,
		marginBottom: 10,
	},
	notesText: {
		...typography.body,
		fontSize: 15,
		lineHeight: 22,
	},
});

export default CheckInMemberDrawer;
