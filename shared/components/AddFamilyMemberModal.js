import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Modal,
	Image,
	ScrollView,
} from 'react-native';
import { useData } from '../../context';
import { familyMembersApi } from '../../api/familyMemberRoutes';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Button from '../buttons/Button';
import { typography } from '../styles/typography';
import debounce from 'lodash/debounce';
import axios from 'axios';
import { uploadApi } from '../../api/uploadRoutes';

const AddFamilyMemberModal = ({ visible, onClose, colors }) => {
	const { organization, user } = useData();
	const [activeTab, setActiveTab] = useState('search'); // 'search' or 'create'
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [userPhoto, setUserPhoto] = useState(null);
	const initialState = {
		firstName: '',
		lastName: '',
		userPhoto: null,
	};
	const [newMember, setNewMember] = useState(initialState);
	const [error, setError] = useState(null);

	// Reset state when modal closes
	useEffect(() => {
		if (!visible) {
			setNewMember(initialState);
			setIsLoading(false);
		}
	}, [visible]);

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
			onClose({
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
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		setIsLoading(true);
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
						newMember
					);
					console.log('photoUrl', photoUrl);
				} catch (uploadError) {
					console.error('Failed to upload photo:', uploadError);
					Alert.alert(
						'Error',
						uploadError.message ||
							'Failed to upload profile photo. Please try again.'
					);
				}
			}
			// First create the member
			const memberData = {
				firstName: newMember.firstName,
				lastName: newMember.lastName,
				createdById: user.id,
				userPhoto: photoUrl,
			};
			console.log('memberData', memberData);
			const response = await familyMembersApi.create(memberData);
			let createdMember = response.familyMember;

			onClose({
				type: 'create',
				familyMember: createdMember,
			});
		} catch (error) {
			console.error('Failed to create family member:', error);
			setError(
				error.response?.data?.message ||
					'Failed to create family member'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		onClose();
		// State will be reset by the useEffect when visible changes to false
	};

	// Updated renderUserItem to handle visibilityStatus
	const renderUserItem = ({ item }) => (
		<TouchableOpacity
			style={styles.userItem}
			onPress={() =>
				handleConnect(item.id, item.firstName, item.lastName)
			}>
			<View style={styles.userInfo}>
				<View style={styles.userImageContainer}>
					<Image
						source={
							item.photoUrl
								? { uri: item.photoUrl }
								: require('../../assets/Assemblie_DefaultUserIcon.png')
						}
						style={styles.userImage}
					/>
				</View>
				<View style={styles.userTextInfo}>
					<Text style={styles.userName}>
						{item.firstName} {item.lastName}
					</Text>
					{item.visibilityStatus && (
						<Text style={styles.userStatus}>
							{item.visibilityStatus}
						</Text>
					)}
				</View>
			</View>
			<TouchableOpacity
				style={styles.connectButton}
				onPress={() =>
					handleConnect(item.id, item.firstName, item.lastName)
				}>
				<Icon
					name='person-add'
					size={24}
					color={colors.secondary}
				/>
			</TouchableOpacity>
		</TouchableOpacity>
	);

	const renderSearchTab = () => (
		<View style={styles.tabContent}>
			<View style={styles.searchContainer}>
				<Icon
					name='search'
					size={20}
					color={colors.textWhite}
					style={styles.searchIcon}
				/>
				<TextInput
					style={[styles.searchInput, { color: colors.textWhite }]}
					placeholder='Search for users by name...'
					placeholderTextColor='rgba(255,255,255,0.6)'
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
					color={colors.secondary}
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
									{ color: colors.textWhite },
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
						userPhoto
							? { uri: userPhoto }
							: require('../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.profileImage}
				/>
				<Text
					style={[
						styles.imagePickerText,
						{ color: colors.textWhite },
					]}>
					Tap to add photo
				</Text>
			</TouchableOpacity>

			<TextInput
				style={[styles.input, { color: colors.textWhite }]}
				placeholder='First Name'
				placeholderTextColor='rgba(255,255,255,0.6)'
				value={newMember.firstName}
				onChangeText={(text) =>
					setNewMember((prev) => ({ ...prev, firstName: text }))
				}
			/>

			<TextInput
				style={[styles.input, { color: colors.textWhite }]}
				placeholder='Last Name'
				placeholderTextColor='rgba(255,255,255,0.6)'
				value={newMember.lastName}
				onChangeText={(text) =>
					setNewMember((prev) => ({ ...prev, lastName: text }))
				}
			/>

			<Button
				type='primary'
				text='Create Family Member'
				onPress={handleCreateMember}
				loading={isLoading}
				style={styles.createButton}
			/>
		</View>
	);

	return (
		<Modal
			animationType='slide'
			transparent={true}
			visible={visible}
			onRequestClose={handleClose}>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.modalContent,
						{ backgroundColor: colors.primary },
					]}>
					<TouchableOpacity
						style={styles.modalCloseButton}
						onPress={handleClose}>
						<Icon
							name='close'
							size={24}
							color={colors.primary}
						/>
					</TouchableOpacity>

					<ScrollView style={styles.modalScrollContent}>
						<View style={styles.contentContainer}>
							<Text
								style={[
									styles.modalTitle,
									{ color: colors.textWhite },
								]}>
								Add Family Member
							</Text>

							<View style={styles.tabContainer}>
								<TouchableOpacity
									style={[
										styles.tab,
										activeTab === 'search' &&
											styles.activeTab,
										{ borderColor: colors.secondary },
									]}
									onPress={() => setActiveTab('search')}>
									<Text
										style={[
											styles.tabText,
											activeTab === 'search' && {
												color: colors.secondary,
											},
										]}>
										Search User
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.tab,
										activeTab === 'create' &&
											styles.activeTab,
										{ borderColor: colors.secondary },
									]}
									onPress={() => setActiveTab('create')}>
									<Text
										style={[
											styles.tabText,
											activeTab === 'create' && {
												color: colors.secondary,
											},
										]}>
										Create New
									</Text>
								</TouchableOpacity>
							</View>

							{activeTab === 'search'
								? renderSearchTab()
								: renderCreateTab()}
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		maxHeight: '80%',
		borderRadius: 20,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	modalCloseButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 1,
		backgroundColor: 'white',
		borderRadius: 15,
		padding: 5,
	},
	modalScrollContent: {
		marginTop: 40,
	},
	contentContainer: {
		padding: 20,
		paddingTop: 40,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
		...typography.h2,
	},
	tabContainer: {
		flexDirection: 'row',
		marginBottom: 20,
		borderRadius: 10,
		overflow: 'hidden',
		marginHorizontal: -20, // Extend tabs to full width
		paddingHorizontal: 20,
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
		color: 'rgba(255,255,255,0.6)',
		fontWeight: '500',
	},
	tabContent: {
		flex: 1,
		width: '100%',
		paddingTop: 10,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 10,
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
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 8,
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
		color: 'white',
	},
	userStatus: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.5)',
		marginTop: 2,
	},
	connectButton: {
		padding: 8,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.1)',
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
	input: {
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
		fontSize: 16,
		width: '100%',
		height: 50,
	},
	createButton: {
		width: '100%',
		padding: 15,
		borderRadius: 10,
		alignItems: 'center',
		marginTop: 10,
		justifyContent: 'center',
		marginBottom: 20,
	},
	createButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	errorText: {
		fontSize: 14,
		marginTop: -15,
		marginBottom: 15,
		marginLeft: 5,
		color: '#a44c62',
		fontWeight: 'bold',
	},
});

export default AddFamilyMemberModal;
