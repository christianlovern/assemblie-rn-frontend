import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	FlatList,
	ScrollView,
	Alert,
	TextInput,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { usersApi } from '../../../api/userRoutes';

const ProfileScreen = () => {
	const { user, organization, familyMembers, setFamilyMembers } = useData();
	const [userData, setUserData] = useState({
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		email: user.email || '',
		phone: user.phoneNumber || '',
		visibility: user.visibility || 'private',
		userPhoto: user.userPhoto || '',
	});
	const [userPhoto, setUserPhoto] = useState(
		require('../../../assets/dummy-org-logo.jpg')
	);

	const [selectedMember, setSelectedMember] = useState(null);
	const [editingMember, setEditingMember] = useState(null);
	const [editedName, setEditedName] = useState({
		firstName: user.firstName || '',
		lastName: user.lastName || '',
	});
	const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);

	const pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		});

		if (!result.canceled) {
			setUserPhoto({ uri: result.assets[0].uri });
		}
	};

	const handleThreeDotsPress = (member) => {
		setSelectedMember(selectedMember?.id === member.id ? null : member);
	};

	const handleAddFamilyMember = () => {
		const newMember = {
			id: Date.now(),
			firstName: 'New',
			lastName: 'Member',
			phoneNumber: '',
		};

		setFamilyMembers((prevMembers) => [...prevMembers, newMember]);
		setEditingMember(newMember);
		setEditedName({
			firstName: newMember.firstName,
			lastName: newMember.lastName,
		});
	};

	const handleSaveChanges = async () => {
		try {
			const updatedUserData = {
				firstName: editedName.firstName,
				lastName: editedName.lastName,
				phoneNumber: userData.phone,
				userPhoto: userPhoto,
				visibility: userData.visibility,
			};

			const updatedUser = await usersApi.updateUser(
				user.id,
				updatedUserData
			);
		} catch (error) {
			console.error('Failed to update user:', error);
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

	const renderFamilyMember = ({ item }) => (
		<View style={styles.memberCard}>
			<Image
				source={
					item.userPhoto
						? { uri: item.userPhoto }
						: require('../../../assets/CongreGate_Logo.png')
				}
				style={styles.userPhoto}
			/>
			<View style={styles.userInfo}>
				{editingMember?.id === item.id ? (
					<View style={styles.editNameContainer}>
						<TextInput
							style={styles.editNameInput}
							value={editedName.firstName}
							onChangeText={(text) =>
								setEditedName({
									...editedName,
									firstName: text,
								})
							}
							placeholder='First Name'
							placeholderTextColor='rgba(255,255,255,0.5)'
						/>
						<TextInput
							style={styles.editNameInput}
							value={editedName.lastName}
							onChangeText={(text) =>
								setEditedName({ ...editedName, lastName: text })
							}
							placeholder='Last Name'
							placeholderTextColor='rgba(255,255,255,0.5)'
						/>
						<TouchableOpacity
							onPress={() => {
								setFamilyMembers((prevMembers) =>
									prevMembers.map((member) =>
										member.id === editingMember.id
											? {
													...member,
													firstName:
														editedName.firstName,
													lastName:
														editedName.lastName,
											  }
											: member
									)
								);
								setEditingMember(null);
								setSelectedMember(null);
							}}
							style={styles.saveButton}>
							<Icon
								name='check'
								size={20}
								color='white'
							/>
						</TouchableOpacity>
					</View>
				) : (
					<Text
						style={
							styles.userName
						}>{`${item.firstName} ${item.lastName}`}</Text>
				)}
				{item.phoneNumber && (
					<Text style={styles.userPhone}>{item.phoneNumber}</Text>
				)}
			</View>
			<View>
				<TouchableOpacity onPress={() => handleThreeDotsPress(item)}>
					<Icon
						name='more-vert'
						size={24}
						color='white'
						style={styles.moreIcon}
					/>
				</TouchableOpacity>
				{selectedMember?.id === item.id && (
					<View style={styles.dropdownMenu}>
						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={() => {
								setEditingMember(item);
								setEditedName({
									firstName: item.firstName,
									lastName: item.lastName,
								});
								setSelectedMember(null);
							}}>
							<Text style={styles.dropdownText}>Edit</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.dropdownItem, styles.deleteItem]}
							onPress={() => {
								setFamilyMembers((prevMembers) =>
									prevMembers.filter(
										(member) =>
											member.id !== selectedMember.id
									)
								);
								setSelectedMember(null);
							}}>
							<Text
								style={[
									styles.dropdownText,
									styles.deleteText,
								]}>
								Delete
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</View>
	);

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}>
				<ScrollView
					contentContainerStyle={styles.scrollContainer}
					keyboardShouldPersistTaps='handled'>
					<View style={styles.avatarContainer}>
						<TouchableOpacity onPress={pickImage}>
							<Image
								source={userPhoto}
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
							value={userData.firstName}
							onChangeText={(value) =>
								setUserData({ ...userData, firstName: value })
							}
							primaryColor={organization.primaryColor}
						/>
						<Text style={styles.label}>Last Name</Text>
						<InputWithIcon
							inputType='user-last'
							value={userData.lastName}
							onChangeText={(value) =>
								setUserData({ ...userData, lastName: value })
							}
							primaryColor={organization.primaryColor}
						/>
						<Text style={styles.label}>Phone Number</Text>
						<InputWithIcon
							inputType='phone'
							value={userData.phone}
							onChangeText={(value) =>
								setUserData({ ...userData, phone: value })
							}
							primaryColor={organization.primaryColor}
						/>
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
												userData.visibility
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
											opt.value === userData.visibility
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
												userData.visibility ===
													option.value &&
													styles.dropdownItemSelected,
											]}
											onPress={() => {
												setUserData({
													...userData,
													visibility: option.value,
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
							data={familyMembers.familyMembers}
							renderItem={renderFamilyMember}
							keyExtractor={(item) => item.id.toString()}
							scrollEnabled={false}
						/>
						<Button
							type='primary'
							text='+ Add a family member'
							primaryColor={organization.primaryColor}
							onPress={handleAddFamilyMember}
							style={{ marginTop: 20 }}
						/>
					</View>
					<Button
						type='gradient'
						text='Save Changes'
						primaryColor={organization.primaryColor}
						secondaryColor={organization.secondaryColor}
						onPress={handleSaveChanges}
						style={styles.button}
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		</Background>
	);
};

const styles = StyleSheet.create({
	scrollContainer: {
		paddingVertical: 20,
		alignItems: 'center',
	},
	avatarContainer: {
		marginTop: '15%',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	editIcon: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 12,
		padding: 4,
	},
	inputContainer: {
		marginTop: 20,
		width: '85%',
		zIndex: 1000,
		elevation: 1000,
	},
	label: {
		color: 'white',
		fontSize: 16,
		marginBottom: 8,
	},
	familyContainer: {
		width: '85%',
		marginTop: 20,
		zIndex: 1,
		elevation: 1,
	},
	memberCard: {
		flexDirection: 'row',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		alignItems: 'center',
	},
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: 25,
	},
	userInfo: {
		flex: 1,
		marginLeft: 12,
		justifyContent: 'center',
	},
	userName: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 2,
	},
	userPhone: {
		color: 'white',
		fontSize: 14,
	},
	moreIcon: {
		marginLeft: 8,
	},
	userIcon: {
		width: 150,
		height: 150,
		resizeMode: 'cover',
		marginRight: 10,
		borderRadius: 75,
	},
	subHeaderText: {
		fontSize: 18,
		color: 'white',
		justifyContent: 'center',
		alignSelf: 'center',
		marginTop: '2%',
	},
	headerText: {
		fontSize: 22,
		color: 'white',
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
		marginBottom: 40,
	},
	button: {
		width: '85%',
	},
	visibilityDropdown: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 16,
		position: 'relative',
		zIndex: 1000,
		elevation: 1000,
	},
	visibilitySelected: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	visibilityLabel: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	visibilityDescription: {
		color: 'rgba(255, 255, 255, 0.8)',
		fontSize: 14,
		marginTop: 8,
	},
	dropdownMenu: {
		position: 'absolute',
		top: '100%',
		left: 0,
		right: 0,
		backgroundColor: 'white',
		borderRadius: 8,
		marginTop: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 1000,
		zIndex: 1000,
	},
	dropdownItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	dropdownText: {
		color: '#333',
		fontSize: 14,
	},
	deleteItem: {
		borderBottomWidth: 0,
	},
	deleteText: {
		color: '#ff4444',
	},
	editNameContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	editNameInput: {
		flex: 1,
		color: 'white',
		fontSize: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'white',
		marginRight: 8,
		padding: 2,
	},
	saveButton: {
		padding: 4,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	dropdownItemSelected: {
		backgroundColor: 'rgba(0, 0, 0, 0.1)',
	},
	dropdownItemText: {
		fontSize: 16,
		color: '#333',
	},
});

export default ProfileScreen;
