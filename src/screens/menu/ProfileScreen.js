import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	FlatList,
	ScrollView,
	Alert,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Modal,
	RefreshControl,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { usersApi } from '../../../api/userRoutes';
import { uploadApi } from '../../../api/uploadRoutes';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { typography } from '../../../shared/styles/typography';
import { useTheme } from '../../../contexts/ThemeContext';
import { familyMembersApi } from '../../../api/familyMemberRoutes';
import AddFamilyMemberModal from '../../../shared/components/AddFamilyMemberModal';
import DeleteConfirmationModal from '../../../shared/components/DeleteConfirmationModal';
import EditFamilyMemberModal from '../../../shared/components/EditFamilyMemberModal';

const ProfileScreen = () => {
	const { user, organization, familyMembers, setFamilyMembers, setUser } =
		useData();
	const { colors } = useTheme();
	const [userData, setUserData] = useState({
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		email: user.email || '',
		phone: user.phoneNumber || '',
		visibilityStatus: user.visibility || 'private',
		userPhoto: user.userPhoto || '',
	});
	const [userPhoto, setUserPhoto] = useState(userData.userPhoto);

	const [selectedMember, setSelectedMember] = useState(null);
	const [editingMember, setEditingMember] = useState(null);
	const [editedFirstName, setEditedFirstName] = useState(
		userData.firstName || ''
	);
	const [editedLastName, setEditedLastName] = useState(
		userData.lastName || ''
	);
	const [editedPhone, setEditedPhone] = useState(userData.phone || '');
	const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [buttonText, setButtonText] = useState('Save Changes');
	const [modalVisible, setModalVisible] = useState(false);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [memberToEdit, setMemberToEdit] = useState(null);
	const [newMember, setNewMember] = useState({
		firstName: '',
		lastName: '',
		userPhoto: '',
	});
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [memberToDelete, setMemberToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [firstNameError, setFirstNameError] = useState('');
	const [lastNameError, setLastNameError] = useState('');
	const [phoneError, setPhoneError] = useState('');

	const fetchFamilyMembers = async () => {
		try {
			setIsRefreshing(true);
			const response = await familyMembersApi.getAll();
			setFamilyMembers(response);
		} catch (error) {
			console.error('Failed to fetch family members:', error);
			Alert.alert('Error', 'Failed to load family members');
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleModalClose = async (newMember) => {
		setModalVisible(false);
		if (newMember) {
			// Refresh the entire list to ensure we have the latest data
			await fetchFamilyMembers();
		}
	};

	const handleEditModalClose = async (updatedMember) => {
		setEditModalVisible(false);
		setMemberToEdit(null);
		if (updatedMember) {
			// Refresh the entire list to ensure we have the latest data
			await fetchFamilyMembers();
		}
	};

	useEffect(() => {
		fetchFamilyMembers();
	}, []);

	const pickImage = async () => {
		try {
			let result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 1,
			});

			if (!result.canceled) {
				setUserPhoto(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image. Please try again.');
		}
	};

	const handleAddFamilyMember = () => {
		setModalVisible(true);
	};

	const validatePhone = (phone) => {
		// Remove all non-digit characters except '+'
		const cleanPhone = phone.replace(/[^\d+]/g, '');

		// If empty, it's valid (since phone is optional)
		if (cleanPhone === '') return true;

		// Check if starts with '+' for international format
		if (cleanPhone.startsWith('+')) {
			// International format: should be between 11 and 15 digits total (including country code)
			// Example: +1-234-567-8900 (12 digits with +1 country code)
			return /^\+\d{11,14}$/.test(cleanPhone);
		} else {
			// US format: should be exactly 10 digits
			// Example: 234-567-8900
			return /^\d{10}$/.test(cleanPhone);
		}
	};

	const handleSaveChanges = async () => {
		// Reset error states
		setFirstNameError('');
		setLastNameError('');
		setPhoneError('');

		// Validate fields
		let hasError = false;

		if (!editedFirstName.trim()) {
			setFirstNameError('First name is required');
			hasError = true;
		}

		if (!editedLastName.trim()) {
			setLastNameError('Last name is required');
			hasError = true;
		}

		if (editedPhone && !validatePhone(editedPhone)) {
			setPhoneError('Please enter a valid phone number');
			hasError = true;
		}

		if (hasError) {
			return;
		}

		try {
			setIsLoading(true);
			let photoUrl = userData.userPhoto;

			if (userPhoto && userPhoto.startsWith('file://')) {
				try {
					const fileObj = {
						uri: userPhoto,
						type: 'image/jpeg',
						name: `photo.${userPhoto.split('.').pop()}`,
					};

					photoUrl = await uploadApi.uploadUserAvatar(
						organization.id,
						user.id,
						fileObj
					);
				} catch (uploadError) {
					console.error('Failed to upload photo:', uploadError);
					Alert.alert(
						'Error',
						uploadError.message ||
							'Failed to upload profile photo. Please try again.'
					);
					setIsLoading(false);
					return;
				}
			}

			const updatedUserData = {
				firstName: editedFirstName,
				lastName: editedLastName,
				phoneNumber: editedPhone,
				userPhoto: photoUrl,
				visibilityStatus: userData.visibilityStatus,
			};

			const updatedUser = await usersApi.updateUser(
				user.id,
				updatedUserData
			);

			// Update the user in context
			setUser((prevUser) => ({
				...prevUser,
				...updatedUserData,
			}));

			setUserData((prev) => ({
				...prev,
				userPhoto: photoUrl,
			}));

			setIsLoading(false);
			setButtonText('Saved!');

			// Reset button text after 5 seconds
			setTimeout(() => {
				setButtonText('Save Changes');
			}, 5000);
		} catch (error) {
			console.error('Failed to update user:', error);
			Alert.alert(
				'Error',
				error.message || 'Failed to update profile. Please try again.'
			);
			setIsLoading(false);
		}
	};

	const visibilityOptions = [
		{
			value: 'hidden',
			label: 'Hidden',
			description:
				'Your information will not show on the Directory page at all',
		},
		{
			value: 'private',
			label: 'Private',
			description:
				'Only your profile picture and name will show on the Directory Page',
		},
		{
			value: 'public',
			label: 'Public',
			description:
				'Your profile picture, name, and phone number will show in the directory page',
		},
	];

	// Create a new component for member actions
	const MemberActions = ({ item, onEdit, onDelete }) => {
		const [showActions, setShowActions] = useState(false);
		const isCustomMember = !item.isRealUser;

		return (
			<View style={styles.connectionActions}>
				{showActions ? (
					<>
						{isCustomMember && (
							<TouchableOpacity
								style={[styles.actionButton, styles.editButton]}
								onPress={() => {
									onEdit(item);
									setShowActions(false);
								}}>
								<Icon
									name='edit'
									size={20}
									color='white'
								/>
							</TouchableOpacity>
						)}
						<TouchableOpacity
							style={[styles.actionButton, styles.rejectButton]}
							onPress={() => {
								onDelete(item);
								setShowActions(false);
							}}>
							<Icon
								name={
									isCustomMember ? 'delete' : 'person-remove'
								}
								size={20}
								color='white'
							/>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionButton, styles.cancelButton]}
							onPress={() => setShowActions(false)}>
							<Icon
								name='close'
								size={20}
								color='white'
							/>
						</TouchableOpacity>
					</>
				) : (
					<TouchableOpacity
						style={[styles.actionButton, styles.moreButton]}
						onPress={() => setShowActions(true)}>
						<Icon
							name='more-vert'
							size={20}
							color='white'
						/>
					</TouchableOpacity>
				)}
			</View>
		);
	};

	const handleAcceptConnection = async (memberId) => {
		try {
			await familyMembersApi.respondToConnection(memberId, true);
			// Refresh the family members list to get the updated data
			await fetchFamilyMembers();
		} catch (error) {
			console.error('Failed to accept connection:', error);
			Alert.alert('Error', 'Failed to accept connection');
		}
	};

	const handleRejectConnection = async (memberId) => {
		try {
			await familyMembersApi.respondToConnection(memberId, false);
			// Update the family members list
			setFamilyMembers((prev) => ({
				...prev,
				pendingConnections: prev.pendingConnections.filter(
					(m) => m.id !== memberId
				),
			}));
		} catch (error) {
			console.error('Failed to reject connection:', error);
			Alert.alert('Error', 'Failed to reject connection');
		}
	};

	const handleCancelConnectionRequest = async (receiverId) => {
		try {
			console.log('CANCELING CONNECTION REQUEST', receiverId);
			await familyMembersApi.cancelConnectionRequest(receiverId);
			// Update the family members list
			setFamilyMembers((prev) => ({
				...prev,
				pendingConnections: prev.pendingConnections.filter(
					(m) => m.id !== receiverId
				),
				activeConnections: prev.activeConnections.filter(
					(m) => m.id !== receiverId
				),
			}));
		} catch (error) {
			console.error('Failed to cancel connection request:', error);
			Alert.alert('Error', 'Failed to cancel connection request');
		}
	};

	const handleDeleteMember = async () => {
		try {
			setIsDeleting(true);
			await familyMembersApi.delete(memberToDelete.id);

			setFamilyMembers((prev) => ({
				...prev,
				activeConnections: prev.activeConnections.filter(
					(member) => member.id !== memberToDelete.id
				),
			}));
			setDeleteModalVisible(false);
			setMemberToDelete(null);
		} catch (error) {
			console.error('Failed to remove family member:', error);
			Alert.alert(
				'Error',
				'Failed to remove family member. Please try again.'
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const showDeleteConfirmation = (member) => {
		setMemberToDelete(member);
		setDeleteModalVisible(true);
	};

	const renderFamilyMember = ({ item }) => {
		if (!item) return null;

		const isPending = item.isRealUser && !item.isConnected;
		const isRequested = isPending && item.requesterId === user.id;

		const handleEditMember = (member) => {
			if (!member.isRealUser) {
				setMemberToEdit(member);
				setEditModalVisible(true);
			}
		};

		return (
			<View style={styles.memberCard}>
				<Image
					source={
						item.userPhoto
							? { uri: item.userPhoto }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.userPhoto}
				/>
				<View style={styles.userInfo}>
					<Text style={styles.userName}>
						{`${item.firstName} ${item.lastName}`}
					</Text>
					{isPending && (
						<Text style={styles.pendingText}>
							Pending Connection
						</Text>
					)}
					{item.phoneNumber && (
						<Text style={styles.userPhone}>{item.phoneNumber}</Text>
					)}
				</View>

				{isPending && !isRequested ? (
					<View style={styles.connectionActions}>
						<TouchableOpacity
							style={[styles.actionButton, styles.acceptButton]}
							onPress={() => handleAcceptConnection(item.id)}>
							<Icon
								name='check'
								size={20}
								color='white'
							/>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionButton, styles.rejectButton]}
							onPress={() => handleRejectConnection(item.id)}>
							<Icon
								name='close'
								size={20}
								color='white'
							/>
						</TouchableOpacity>
					</View>
				) : isRequested ? (
					<>
						<Icon
							name='send-to-mobile'
							size={20}
							color='white'
						/>
						<TouchableOpacity
							style={[
								styles.actionButton,
								styles.rejectButton,
								{ marginLeft: 10 },
							]}
							onPress={() =>
								handleCancelConnectionRequest(item.id)
							}>
							<Icon
								name='close'
								size={20}
								color='white'
							/>
						</TouchableOpacity>
					</>
				) : (
					<MemberActions
						item={item}
						onEdit={handleEditMember}
						onDelete={() => showDeleteConfirmation(item)}
					/>
				)}
			</View>
		);
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.container}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
				<ScrollView
					contentContainerStyle={[
						styles.scrollContainer,
						{ overflow: 'visible' },
					]}
					keyboardShouldPersistTaps='handled'
					scrollEnabled={true}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={fetchFamilyMembers}
							tintColor={colors.secondary}
						/>
					}>
					<View style={styles.avatarContainer}>
						<TouchableOpacity onPress={pickImage}>
							<Image
								source={
									userPhoto
										? { uri: userPhoto }
										: require('../../../assets/CongreGate_Logo.png')
								}
								style={styles.userIcon}
							/>
							<View style={styles.editIcon}>
								<Icon
									name='edit'
									size={24}
									color='white'
								/>
							</View>
						</TouchableOpacity>
						<Text style={styles.subHeaderText}>
							{'Tap to change profile photo'}
						</Text>
					</View>
					<View style={styles.inputContainer}>
						<Text style={styles.label}>First Name</Text>
						<InputWithIcon
							inputType='user-first'
							value={editedFirstName}
							onChangeText={(value) => {
								setEditedFirstName(value);
								setFirstNameError('');
							}}
							primaryColor={organization.primaryColor}
						/>
						{firstNameError ? (
							<Text style={styles.errorText}>
								{firstNameError}
							</Text>
						) : null}

						<Text style={styles.label}>Last Name</Text>
						<InputWithIcon
							inputType='user-last'
							value={editedLastName}
							onChangeText={(value) => {
								setEditedLastName(value);
								setLastNameError('');
							}}
							primaryColor={organization.primaryColor}
						/>
						{lastNameError ? (
							<Text style={styles.errorText}>
								{lastNameError}
							</Text>
						) : null}

						<Text style={styles.label}>Phone Number</Text>
						<InputWithIcon
							inputType='phone'
							value={editedPhone}
							onChangeText={(value) => {
								setEditedPhone(value);
								setPhoneError('');
							}}
							primaryColor={organization.primaryColor}
						/>
						{phoneError ? (
							<Text style={styles.errorText}>{phoneError}</Text>
						) : null}

						<Text style={[styles.label, { marginTop: 20 }]}>
							Profile Visibility
						</Text>
						<TouchableOpacity
							style={styles.visibilityDropdown}
							onPress={() =>
								setShowVisibilityDropdown(
									!showVisibilityDropdown
								)
							}>
							<View style={styles.visibilitySelected}>
								<Text style={styles.visibilityLabel}>
									{
										visibilityOptions.find(
											(opt) =>
												opt.value ===
												userData.visibilityStatus
										)?.label
									}
								</Text>
								<Icon
									name={
										showVisibilityDropdown
											? 'keyboard-arrow-up'
											: 'keyboard-arrow-down'
									}
									size={24}
									color='white'
								/>
							</View>
							<Text style={styles.visibilityDescription}>
								{
									visibilityOptions.find(
										(opt) =>
											opt.value ===
											userData.visibilityStatus
									)?.description
								}
							</Text>

							{showVisibilityDropdown && (
								<View style={styles.dropdownMenu}>
									{visibilityOptions.map((option) => (
										<TouchableOpacity
											key={option.value}
											style={[
												styles.dropdownItem,
												userData.visibilityStatus ===
													option.value &&
													styles.dropdownItemSelected,
											]}
											onPress={() => {
												setUserData({
													...userData,
													visibilityStatus:
														option.value,
												});
												setShowVisibilityDropdown(
													false
												);
											}}>
											<Text
												style={styles.dropdownItemText}>
												{option.label}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							)}
						</TouchableOpacity>
					</View>
					<View style={styles.familyContainer}>
						<Text style={styles.headerText}>Family Members</Text>
						<FlatList
							data={familyMembers?.activeConnections || []}
							renderItem={renderFamilyMember}
							keyExtractor={(item) =>
								item?.id?.toString() || Math.random().toString()
							}
							scrollEnabled={false}
							style={{ zIndex: 1 }}
							contentContainerStyle={{ overflow: 'visible' }}
							ListEmptyComponent={() => (
								<Text
									style={[
										styles.userName,
										{ textAlign: 'center' },
									]}>
									No active family members
								</Text>
							)}
						/>
						{familyMembers?.pendingConnections?.length > 0 && (
							<>
								<Text style={styles.sectionTitle}>
									Pending Connections
								</Text>
								<FlatList
									data={familyMembers.pendingConnections}
									renderItem={renderFamilyMember}
									keyExtractor={(item) =>
										item?.id?.toString() ||
										Math.random().toString()
									}
									scrollEnabled={false}
									contentContainerStyle={{
										overflow: 'visible',
									}}
								/>
							</>
						)}
						<Button
							type='primary'
							text='+ Add a family member'
							primaryColor={organization.primaryColor}
							onPress={handleAddFamilyMember}
							style={styles.addMemberButton}
						/>
					</View>
					<Button
						type='gradient'
						text={buttonText}
						primaryColor={organization.primaryColor}
						secondaryColor={organization.secondaryColor}
						onPress={handleSaveChanges}
						style={styles.saveButton}
						loading={isLoading}
						disabled={isLoading || buttonText === 'Saved!'}
					/>
				</ScrollView>
			</KeyboardAvoidingView>
			<AddFamilyMemberModal
				visible={modalVisible}
				onClose={handleModalClose}
				colors={colors}
			/>
			<EditFamilyMemberModal
				visible={editModalVisible}
				onClose={handleEditModalClose}
				familyMember={memberToEdit}
				colors={colors}
			/>
			<DeleteConfirmationModal
				visible={deleteModalVisible}
				onClose={() => {
					setDeleteModalVisible(false);
					setMemberToDelete(null);
				}}
				onConfirm={handleDeleteMember}
				message={
					memberToDelete && !memberToDelete.isRealUser
						? 'Are you sure you want to delete this family member?'
						: 'Are you sure you want to remove this connection?'
				}
				colors={colors}
				isLoading={isDeleting}
				organization={organization}
			/>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		overflow: 'visible',
	},
	scrollContainer: {
		paddingVertical: 20,
		alignItems: 'center',
		overflow: 'visible',
	},
	avatarContainer: {
		marginTop: '15%',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	userIcon: {
		width: 150,
		height: 150,
		resizeMode: 'cover',
		borderRadius: 75,
	},
	editIcon: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 12,
		padding: 4,
	},
	subHeaderText: {
		...typography.bodyMedium,
		color: 'white',
		marginTop: '2%',
	},
	inputContainer: {
		marginTop: 20,
		width: '85%',
		zIndex: 1000,
		elevation: 1000,
	},
	label: {
		...typography.body,
		color: 'white',
		marginBottom: 8,
	},
	familyContainer: {
		width: '85%',
		marginTop: 20,
		zIndex: 1,
		elevation: 1,
		overflow: 'visible',
	},
	headerText: {
		...typography.h2,
		color: 'white',
		textAlign: 'center',
		marginBottom: 40,
		marginTop: 20,
	},
	memberCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 12,
		marginBottom: 12,
		position: 'relative',
		zIndex: 1,
		minHeight: 70,
		overflow: 'visible',
	},
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	userInfo: {
		flex: 1,
		justifyContent: 'center',
	},
	userName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		marginBottom: 4,
	},
	pendingText: {
		fontSize: 12,
		color: 'rgba(255, 255, 255, 0.6)',
		marginBottom: 4,
	},
	userPhone: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.8)',
	},
	moreIcon: {
		padding: 8,
		zIndex: 1,
	},
	dropdownMenu: {
		position: 'absolute',
		right: 0,
		bottom: 35,
		backgroundColor: 'rgba(40, 40, 40, 0.95)',
		borderRadius: 8,
		padding: 4,
		minWidth: 160,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 10,
		zIndex: 12,
		overflow: 'visible',
	},
	dropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 4,
	},
	dropdownIcon: {
		marginRight: 8,
	},
	dropdownText: {
		color: 'white',
		fontSize: 16,
	},
	deleteItem: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	deleteText: {
		color: '#F44336',
	},
	editNameContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	editNameInput: {
		...typography.body,
		flex: 1,
		color: 'white',
		borderBottomWidth: 1,
		borderBottomColor: 'white',
		marginRight: 8,
		padding: 2,
	},
	saveButton: {
		width: '85%',
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	addMemberButton: {
		marginTop: 20,
	},
	visibilityDropdown: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
		marginTop: 8,
		position: 'relative',
	},
	visibilitySelected: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	visibilityLabel: {
		...typography.h3,
		color: 'white',
	},
	visibilityDescription: {
		...typography.body,
		color: 'rgba(255, 255, 255, 0.7)',
		marginTop: 4,
	},
	dropdownItemSelected: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	dropdownItemText: {
		...typography.body,
		color: 'white',
	},
	contentContainer: {
		padding: 15,
		alignItems: 'center',
	},
	imageContainer: {
		width: 150,
		height: 150,
		marginBottom: 20,
		borderRadius: 75,
		overflow: 'hidden',
	},
	memberImage: {
		width: '100%',
		height: '100%',
		borderRadius: 75,
	},
	imagePlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: 'rgba(255,255,255,0.2)',
		borderRadius: 75,
		justifyContent: 'center',
		alignItems: 'center',
	},
	imagePlaceholderText: {
		color: 'white',
		marginTop: 5,
		...typography.bodySmall,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: 'white',
		marginBottom: 20,
		...typography.h2,
	},
	input: {
		width: '100%',
		height: 50,
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 10,
		marginBottom: 15,
		paddingHorizontal: 15,
		...typography.bodyMedium,
	},
	buttonContainer: {
		width: '100%',
		marginTop: 20,
	},
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
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginTop: 20,
		marginBottom: 10,
		color: '#FFFFFF',
	},
	connectionActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	actionButton: {
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 18,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	acceptButton: {
		backgroundColor: '#4CAF50',
		borderWidth: 1,
		borderColor: '#45A049',
	},
	rejectButton: {
		backgroundColor: '#F44336',
		borderWidth: 1,
		borderColor: '#E53935',
	},
	editButton: {
		backgroundColor: '#2196F3',
		borderWidth: 1,
		borderColor: '#1E88E5',
	},
	moreButton: {
		backgroundColor: '#404040',
		borderWidth: 1,
		borderColor: '#505050',
	},
	cancelButton: {
		backgroundColor: '#757575',
		borderWidth: 1,
		borderColor: '#616161',
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

export default ProfileScreen;
