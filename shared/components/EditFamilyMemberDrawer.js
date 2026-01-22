import React, { useState, useEffect } from 'react';
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
	Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { familyMembersApi } from '../../api/familyMemberRoutes';
import * as ImagePicker from 'expo-image-picker';
import Button from '../buttons/Button';
import InputWithIcon from './ImputWithIcon';
import { typography } from '../styles/typography';
import { uploadApi } from '../../api/uploadRoutes';

const EditFamilyMemberDrawer = ({ visible, onRequestClose, familyMember }) => {
	const { organization } = useData();
	const { colors, colorMode } = useTheme();
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));
	const [isLoading, setIsLoading] = useState(false);
	const [userPhoto, setUserPhoto] = useState(null);
	const [memberData, setMemberData] = useState({
		firstName: '',
		lastName: '',
	});
	const [error, setError] = useState(null);
	const [photoChanged, setPhotoChanged] = useState(false);

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

	// Initialize form with family member data when drawer opens
	useEffect(() => {
		if (visible && familyMember) {
			setMemberData({
				firstName: familyMember.firstName || '',
				lastName: familyMember.lastName || '',
			});
			setUserPhoto(familyMember.userPhoto || null);
			setPhotoChanged(false);
			setError(null);
		}
	}, [visible, familyMember]);

	const screenHeight = Dimensions.get('window').height;
	const drawerHeight = screenHeight * 0.6;
	const translateY = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerHeight, 0], // Slide from bottom (off screen) to visible
	});

	const pickImage = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 1,
			});

			if (!result.canceled) {
				const selectedAsset = result.assets[0].uri;
				setUserPhoto(selectedAsset);
				setPhotoChanged(true);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image');
		}
	};

	const handleUpdateMember = async () => {
		if (!memberData.firstName || !memberData.lastName) {
			setError('Please fill in all required fields');
			return;
		}

		// Check if anything has changed
		const nameChanged =
			memberData.firstName !== familyMember.firstName ||
			memberData.lastName !== familyMember.lastName;

		if (!nameChanged && !photoChanged) {
			onRequestClose();
			return;
		}

		setIsLoading(true);
		setError(null);
		let photoUrl = familyMember.userPhoto;

		try {
			// Only upload photo if it has changed and is a file URI
			if (photoChanged && userPhoto && userPhoto.startsWith('file://')) {
				try {
					const fileObj = {
						uri: userPhoto,
						type: 'image/jpeg',
						name: `photo.${userPhoto.split('.').pop()}`,
					};
					photoUrl = await uploadApi.uploadAvatar(
						organization.id,
						familyMember.id,
						fileObj,
						memberData
					);
				} catch (uploadError) {
					console.error('Failed to upload photo:', uploadError);
					setError(
						uploadError.message ||
							'Failed to upload profile photo. Please try again.'
					);
					setIsLoading(false);
					return;
				}
			}

			// Only update if something changed
			const updateData = {
				id: familyMember.id,
				...(nameChanged
					? {
							firstName: memberData.firstName,
							lastName: memberData.lastName,
					  }
					: {}),
				...(photoChanged ? { userPhoto: photoUrl } : {}),
			};

			const response = await familyMembersApi.update(
				familyMember.id,
				updateData
			);

			onRequestClose({
				type: 'update',
				familyMember: response.familyMember || response,
			});
		} catch (error) {
			console.error('Failed to update family member:', error);
			setError(
				error.response?.data?.message ||
					'Failed to update family member'
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (!familyMember) return null;

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
							<TouchableOpacity onPress={pickImage}>
								<Image
									source={
										userPhoto && userPhoto.trim && userPhoto.trim() !== ''
											? { uri: userPhoto }
											: require('../../assets/Assemblie_DefaultUserIcon.png')
									}
									style={styles.userPhoto}
									resizeMode="cover"
								/>
							</TouchableOpacity>
							<View style={styles.headerTextContainer}>
								<Text
									style={[styles.drawerTitle, { color: colors.text }]}
									numberOfLines={1}>
									Edit Family Member
								</Text>
								<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
									Tap photo to change
								</Text>
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
						<View style={styles.contentContainer}>
							<Text style={[styles.label, { color: colors.text }]}>
								First Name
							</Text>
							<InputWithIcon
								inputType="user-first"
								value={memberData.firstName}
								onChangeText={(text) =>
									setMemberData((prev) => ({
										...prev,
										firstName: text,
									}))
								}
								primaryColor={colors.primary}
							/>

							<Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
								Last Name
							</Text>
							<InputWithIcon
								inputType="user-last"
								value={memberData.lastName}
								onChangeText={(text) =>
									setMemberData((prev) => ({
										...prev,
										lastName: text,
									}))
								}
								primaryColor={colors.primary}
							/>

							{error && (
								<Text style={styles.errorText}>{error}</Text>
							)}

							<Button
								type="primary"
								text="Update Family Member"
								onPress={handleUpdateMember}
								loading={isLoading}
								primaryColor={organization.primaryColor}
								style={styles.updateButton}
							/>
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
	subtitle: {
		...typography.bodyMedium,
		fontSize: 12,
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
	label: {
		...typography.body,
		marginBottom: 8,
		fontSize: 14,
	},
	updateButton: {
		marginTop: 24,
		width: '100%',
	},
	errorText: {
		fontSize: 14,
		marginTop: 8,
		marginBottom: 8,
		color: '#a44c62',
		fontWeight: 'bold',
	},
});

export default EditFamilyMemberDrawer;
