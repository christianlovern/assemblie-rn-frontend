import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
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
import { uploadApi } from '../../api/uploadRoutes';

const EditFamilyMemberModal = ({ visible, onClose, familyMember, colors }) => {
	const { organization, user } = useData();
	const [isLoading, setIsLoading] = useState(false);
	const [userPhoto, setUserPhoto] = useState(null);
	const [memberData, setMemberData] = useState({
		firstName: '',
		lastName: '',
	});
	const [error, setError] = useState(null);
	const [photoChanged, setPhotoChanged] = useState(false);

	console.log('familyMember', familyMember);

	// Initialize form with family member data when modal opens
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
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		// Check if anything has changed
		const nameChanged =
			memberData.firstName !== familyMember.firstName ||
			memberData.lastName !== familyMember.lastName;

		if (!nameChanged && !photoChanged) {
			onClose();
			return;
		}

		setIsLoading(true);
		let photoUrl = familyMember.photoUrl;

		try {
			// Only upload photo if it has changed and is a file URI
			if (photoChanged && userPhoto && userPhoto.startsWith('file://')) {
				try {
					const fileObj = {
						uri: userPhoto,
						type: 'image/jpeg',
						name: `photo.${userPhoto.split('.').pop()}`,
					};
					console.log('familyMember.id', familyMember.id);
					photoUrl = await uploadApi.uploadAvatar(
						organization.id,
						familyMember.id,
						fileObj,
						memberData
					);
				} catch (uploadError) {
					console.error('Failed to upload photo:', uploadError);
					Alert.alert(
						'Error',
						uploadError.message ||
							'Failed to upload profile photo. Please try again.'
					);
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

			onClose({
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

	const handleClose = () => {
		onClose();
	};

	if (familyMember) {
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
									Edit Family Member
								</Text>

								<TouchableOpacity
									style={styles.imagePickerContainer}
									onPress={pickImage}>
									<Image
										source={
											userPhoto
												? {
														uri: userPhoto,
												  }
												: require('../../assets/Assemblie_DefaultUserIcon.png')
										}
										style={styles.profileImage}
									/>
									<Text
										style={[
											styles.imagePickerText,
											{ color: colors.textWhite },
										]}>
										Tap to change photo
									</Text>
								</TouchableOpacity>

								<TextInput
									style={[
										styles.input,
										{ color: colors.textWhite },
									]}
									placeholder='First Name'
									placeholderTextColor='rgba(255,255,255,0.6)'
									value={memberData.firstName}
									onChangeText={(text) =>
										setMemberData((prev) => ({
											...prev,
											firstName: text,
										}))
									}
								/>

								<TextInput
									style={[
										styles.input,
										{ color: colors.textWhite },
									]}
									placeholder='Last Name'
									placeholderTextColor='rgba(255,255,255,0.6)'
									value={memberData.lastName}
									onChangeText={(text) =>
										setMemberData((prev) => ({
											...prev,
											lastName: text,
										}))
									}
								/>

								{error && (
									<Text style={styles.errorText}>
										{error}
									</Text>
								)}

								<Button
									type='primary'
									text='Update Family Member'
									onPress={handleUpdateMember}
									loading={isLoading}
									style={styles.updateButton}
								/>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>
		);
	}
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
	updateButton: {
		width: '100%',
		padding: 15,
		borderRadius: 10,
		alignItems: 'center',
		marginTop: 10,
		justifyContent: 'center',
		marginBottom: 20,
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

export default EditFamilyMemberModal;
