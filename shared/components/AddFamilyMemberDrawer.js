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
	FlatList,
	ActivityIndicator,
	TextInput,
	Keyboard,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { familyMembersApi } from '../../api/familyMemberRoutes';
import * as ImagePicker from 'expo-image-picker';
import Button from '../buttons/Button';
import InputWithIcon from './ImputWithIcon';
import KeyboardAwareScrollView from './KeyboardAwareScrollView';
import { typography } from '../styles/typography';
import debounce from 'lodash/debounce';
import { uploadApi } from '../../api/uploadRoutes';

const AddFamilyMemberDrawer = ({ visible, onRequestClose }) => {
	const { organization, user } = useData();
	const { colors, colorMode } = useTheme();
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));
	const [activeTab, setActiveTab] = useState('search'); // 'search' or 'create'
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [userPhoto, setUserPhoto] = useState(null);
	const initialState = {
		firstName: '',
		lastName: '',
		userPhoto: null,
	};
	const [newMember, setNewMember] = useState(initialState);
	const [error, setError] = useState(null);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	// Shrink drawer when keyboard opens so it sits above the keyboard (drawers are fixed at bottom)
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

	// Reset state when drawer closes
	useEffect(() => {
		if (!visible) {
			setNewMember(initialState);
			setUserPhoto(null);
			setSearchQuery('');
			setSearchResults([]);
			setError(null);
			setIsLoading(false);
		}
	}, [visible]);

	const screenHeight = Dimensions.get('window').height;
	const drawerHeight = screenHeight * 0.7; // Slightly taller for search/create tabs
	const paddingAboveKeyboard = 20;
	const effectiveDrawerHeight =
		keyboardHeight > 0
			? Math.min(
					drawerHeight,
					screenHeight - keyboardHeight - paddingAboveKeyboard,
				)
			: drawerHeight;
	const translateY = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerHeight, 0], // Slide from bottom (off screen) to visible
	});

	// Updated searchUsers function to use familyMembersApi
	const searchUsers = debounce(async (query) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsLoading(true);
		try {
			const response = await familyMembersApi.searchByName(query);
			setSearchResults(response.users || []);
		} catch (error) {
			console.error('Search failed:', error);
			Alert.alert('Error', 'Failed to search for users');
			setSearchResults([]);
		} finally {
			setIsLoading(false);
		}
	}, 500);

	const handleConnect = async (userId, firstName, lastName) => {
		try {
			const response = await familyMembersApi.connect(userId);
			onRequestClose({
				type: 'connect',
				familyMember: response.familyMember,
			});
		} catch (error) {
			console.error('Connection failed:', error);
			setError(`You are already connected with ${firstName} ${lastName}`);
		}
	};

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
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image');
		}
	};

	const handleCreateMember = async () => {
		if (!newMember.firstName || !newMember.lastName) {
			setError('Please fill in all required fields');
			return;
		}

		setIsLoading(true);
		setError(null);
		let photoUrl = null;
		try {
			// If there's a photo, upload it and update the member
			if (userPhoto && userPhoto.startsWith('file://')) {
				try {
					const fileObj = {
						uri: userPhoto,
						type: 'image/jpeg',
						name: `photo.${userPhoto.split('.').pop()}`,
					};
					photoUrl = await uploadApi.uploadAvatar(
						organization.id,
						user.id,
						fileObj,
						newMember,
					);
				} catch (uploadError) {
					console.error('Failed to upload photo:', uploadError);
					setError(
						uploadError.message ||
							'Failed to upload profile photo. Please try again.',
					);
					setIsLoading(false);
					return;
				}
			}
			// First create the member
			const memberData = {
				firstName: newMember.firstName,
				lastName: newMember.lastName,
				createdById: user.id,
				userPhoto: photoUrl,
			};
			const response = await familyMembersApi.create(memberData);
			let createdMember = response.familyMember;

			onRequestClose({
				type: 'create',
				familyMember: createdMember,
			});
		} catch (error) {
			console.error('Failed to create family member:', error);
			setError(
				error.response?.data?.message ||
					'Failed to create family member',
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Updated renderUserItem to handle visibilityStatus
	const renderUserItem = ({ item }) => (
		<TouchableOpacity
			style={[
				styles.userItem,
				{
					backgroundColor:
						colorMode === 'dark'
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(0, 0, 0, 0.05)',
				},
			]}
			onPress={() =>
				handleConnect(item.id, item.firstName, item.lastName)
			}>
			<View style={styles.userInfo}>
				<View style={styles.userImageContainer}>
					<Image
						source={
							item.photoUrl &&
							item.photoUrl.trim &&
							item.photoUrl.trim() !== ''
								? { uri: item.photoUrl }
								: require('../../assets/Assemblie_DefaultUserIcon.png')
						}
						style={styles.userImage}
						resizeMode='cover'
					/>
				</View>
				<View style={styles.userTextInfo}>
					<Text style={[styles.userName, { color: colors.text }]}>
						{item.firstName} {item.lastName}
					</Text>
					{item.visibilityStatus && (
						<Text
							style={[
								styles.userStatus,
								{ color: colors.textSecondary },
							]}>
							{item.visibilityStatus}
						</Text>
					)}
				</View>
			</View>
			<TouchableOpacity
				style={[
					styles.connectButton,
					{
						backgroundColor:
							colorMode === 'dark'
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.05)',
					},
				]}
				onPress={() =>
					handleConnect(item.id, item.firstName, item.lastName)
				}>
				<Icon
					name='person-add'
					size={24}
					color={colors.primary || organization.primaryColor}
				/>
			</TouchableOpacity>
		</TouchableOpacity>
	);

	const renderSearchTab = () => (
		<View style={styles.tabContent}>
			<View
				style={[
					styles.searchContainer,
					{
						backgroundColor:
							colorMode === 'dark'
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.05)',
					},
				]}>
				<Icon
					name='search'
					size={20}
					color={colors.textSecondary}
					style={styles.searchIcon}
				/>
				<TextInput
					style={[styles.searchInput, { color: colors.text }]}
					placeholder='Search for users by name...'
					placeholderTextColor={colors.textSecondary}
					value={searchQuery}
					onChangeText={(text) => {
						setSearchQuery(text);
						searchUsers(text);
					}}
					autoCapitalize='none'
					autoCorrect={false}
				/>
			</View>

			{isLoading ? (
				<ActivityIndicator
					style={styles.loader}
					color={colors.primary || organization.primaryColor}
				/>
			) : (
				<>
					{error && <Text style={styles.errorText}>{error}</Text>}
					<FlatList
						data={searchResults}
						renderItem={renderUserItem}
						keyExtractor={(item) => item.id.toString()}
						ListEmptyComponent={() => (
							<Text
								style={[
									styles.emptyText,
									{ color: colors.textSecondary },
								]}>
								{searchQuery.trim()
									? 'No users found'
									: 'Start typing to search for users'}
							</Text>
						)}
						style={styles.searchResults}
					/>
				</>
			)}
		</View>
	);

	const renderCreateTab = () => (
		<View style={styles.tabContent}>
			<TouchableOpacity
				style={styles.imagePickerContainer}
				onPress={pickImage}>
				<Image
					source={
						userPhoto && userPhoto.trim && userPhoto.trim() !== ''
							? { uri: userPhoto }
							: require('../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.profileImage}
					resizeMode='cover'
				/>
				<Text
					style={[
						styles.imagePickerText,
						{ color: colors.textSecondary },
					]}>
					Tap to add photo
				</Text>
			</TouchableOpacity>

			<Text style={[styles.label, { color: colors.text }]}>
				First Name
			</Text>
			<InputWithIcon
				inputType='user-first'
				value={newMember.firstName}
				onChangeText={(text) =>
					setNewMember((prev) => ({ ...prev, firstName: text }))
				}
				primaryColor={colors.primary}
			/>

			<Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
				Last Name
			</Text>
			<InputWithIcon
				inputType='user-last'
				value={newMember.lastName}
				onChangeText={(text) =>
					setNewMember((prev) => ({ ...prev, lastName: text }))
				}
				primaryColor={colors.primary}
			/>

			{error && <Text style={styles.errorText}>{error}</Text>}

			<Button
				type='primary'
				text='Create Family Member'
				onPress={handleCreateMember}
				loading={isLoading}
				primaryColor={organization.primaryColor}
				style={styles.createButton}
			/>
		</View>
	);

	return (
		<Modal
			visible={visible}
			transparent
			animationType='none'
			onRequestClose={onRequestClose}>
			<View
				style={styles.container}
				pointerEvents={visible ? 'auto' : 'none'}>
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
							height: effectiveDrawerHeight,
							bottom: keyboardHeight,
							transform: [{ translateY }],
							backgroundColor: colors.background || '#1A1A1A',
						},
					]}
					pointerEvents={visible ? 'auto' : 'none'}>
					{/* Header */}
					<View style={styles.drawerHeader}>
						<View style={styles.headerContent}>
							<View style={styles.headerTextContainer}>
								<Text
									style={[
										styles.drawerTitle,
										{ color: colors.text },
									]}
									numberOfLines={1}>
									Add Family Member
								</Text>
							</View>
						</View>
						<TouchableOpacity
							onPress={onRequestClose}
							style={styles.closeButton}>
							<Icon
								name='close'
								size={28}
								color={colors.text}
							/>
						</TouchableOpacity>
					</View>

					{/* Tabs */}
					<View style={styles.tabContainer}>
						<TouchableOpacity
							style={[
								styles.tab,
								activeTab === 'search' && styles.activeTab,
								{
									borderBottomColor:
										activeTab === 'search'
											? colors.primary ||
												organization.primaryColor
											: 'transparent',
								},
							]}
							onPress={() => {
								setActiveTab('search');
								setError(null);
							}}>
							<Text
								style={[
									styles.tabText,
									{
										color:
											activeTab === 'search'
												? colors.primary ||
													organization.primaryColor
												: colors.textSecondary,
									},
								]}>
								Search User
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.tab,
								activeTab === 'create' && styles.activeTab,
								{
									borderBottomColor:
										activeTab === 'create'
											? colors.primary ||
												organization.primaryColor
											: 'transparent',
								},
							]}
							onPress={() => {
								setActiveTab('create');
								setError(null);
							}}>
							<Text
								style={[
									styles.tabText,
									{
										color:
											activeTab === 'create'
												? colors.primary ||
													organization.primaryColor
												: colors.textSecondary,
									},
								]}>
								Create New
							</Text>
						</TouchableOpacity>
					</View>

					<KeyboardAwareScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
						<View style={styles.contentContainer}>
							{activeTab === 'search'
								? renderSearchTab()
								: renderCreateTab()}
						</View>
					</KeyboardAwareScrollView>
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
	headerTextContainer: {
		flex: 1,
	},
	drawerTitle: {
		...typography.h3,
		fontSize: 20,
		fontWeight: '600',
	},
	closeButton: {
		padding: 4,
	},
	tabContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	activeTab: {
		borderBottomWidth: 2,
	},
	tabText: {
		fontSize: 16,
		fontWeight: '500',
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
	tabContent: {
		flex: 1,
		width: '100%',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		paddingHorizontal: 15,
		marginBottom: 20,
		height: 50,
		width: '100%',
	},
	searchIcon: {
		marginRight: 10,
	},
	searchInput: {
		flex: 1,
		height: '100%',
		fontSize: 16,
	},
	searchResults: {
		width: '100%',
		marginTop: 10,
	},
	userItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 12,
		marginBottom: 8,
	},
	userInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	userImageContainer: {
		marginRight: 12,
	},
	userImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	userTextInfo: {
		flex: 1,
	},
	userName: {
		fontSize: 16,
		fontWeight: '500',
	},
	userStatus: {
		fontSize: 12,
		marginTop: 2,
	},
	connectButton: {
		padding: 8,
		borderRadius: 20,
	},
	emptyText: {
		textAlign: 'center',
		marginTop: 20,
		fontSize: 14,
		marginBottom: 20,
	},
	loader: {
		marginTop: 20,
	},
	imagePickerContainer: {
		alignItems: 'center',
		marginBottom: 30,
		width: '100%',
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 10,
	},
	imagePickerText: {
		fontSize: 14,
		marginTop: 8,
	},
	label: {
		...typography.body,
		marginBottom: 8,
		fontSize: 14,
	},
	createButton: {
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

export default AddFamilyMemberDrawer;
