import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Modal,
	TextInput,
	SafeAreaView,
	Platform,
	Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useData } from '../../../context';
import { checkInsApi } from '../../../api/checkInRoutes';
import { familyMembersApi } from '../../../api/familyMemberRoutes';
import { ministryApi } from '../../../api/ministryRoutes';
import Background from '../../../shared/components/Background';
import Button from '../../../shared/buttons/Button';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { typography } from '../../../shared/styles/typography';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import PickupQRDrawer from '../../../shared/components/PickupQRDrawer';
import { useRoute } from '@react-navigation/native';

const CheckInScreen = () => {
	const route = useRoute();
	const [checkedInMemberIds, setCheckedInMemberIds] = useState([]);
	const [checkedInUserIds, setCheckedInUserIds] = useState([]);
	const [selectedMemberIds, setSelectedMemberIds] = useState([]);
	const {
		user,
		organization,
		ministries,
		selectedMinistry,
		setSelectedMinistry,
		familyMembers,
	} = useData();

	const confettiRef = useRef(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [newMember, setNewMember] = useState({
		firstName: '',
		lastName: '',
		userPhoto: '',
	});
	const [open, setOpen] = useState(false);
	const [ministryItems, setMinistryItems] = useState([]);
	const [ministryValue, setMinistryValue] = useState(null);

	// QR checkout (Flow A): ministry requires QR for pickup
	const [ministryDetail, setMinistryDetail] = useState(null);
	const [guardianCheckInStatus, setGuardianCheckInStatus] = useState(null);
	const [checkoutTokensByAttendee, setCheckoutTokensByAttendee] = useState(
		{},
	);
	const [pickupQRModal, setPickupQRModal] = useState({
		visible: false,
		initialIndex: 0,
	});

	const fetchCheckInStatus = async (ministryId) => {
		try {
			setLoading(true);
			const allCheckIns = await checkInsApi.getAllForMinistry(ministryId);
			console.log(
				'All check-ins (detailed):',
				JSON.stringify(allCheckIns, null, 2),
			);

			const today = new Date().toISOString().split('T')[0];
			console.log('Today:', today);

			if (!allCheckIns || !allCheckIns.checkIns) {
				console.error('Invalid check-ins data:', allCheckIns);
				return;
			}

			const todayCheckIns = allCheckIns.checkIns.find(
				(checkIn) => checkIn.date === today,
			) || { users: [], familyMembers: [] };
			console.log(
				"Today's check-ins (detailed):",
				JSON.stringify(todayCheckIns, null, 2),
			);

			const userIds = todayCheckIns.users?.map((user) => user.id) || [];
			const familyMemberIds =
				todayCheckIns.familyMembers?.map((member) => member.id) || [];

			console.log('Checked-in user IDs:', userIds);
			console.log('Checked-in family member IDs:', familyMemberIds);

			setCheckedInUserIds(userIds);
			setCheckedInMemberIds(familyMemberIds);

			// Pickup QR: backend returns checkoutToken only for current user + linked family in this response
			setCheckoutTokensByAttendee((prev) => {
				const next = { ...prev };
				todayCheckIns.users?.forEach((u) => {
					if (u.id != null && u.checkoutToken != null)
						next[u.id] = u.checkoutToken;
				});
				todayCheckIns.familyMembers?.forEach((fm) => {
					if (fm.id != null && fm.checkoutToken != null)
						next[fm.id] = fm.checkoutToken;
				});
				return next;
			});

			// Reset selected members to match the currently checked-in members for this ministry
			setSelectedMemberIds([...userIds, ...familyMemberIds]);
		} catch (error) {
			console.error('Failed to fetch check-in status:', error);
		} finally {
			setLoading(false);
		}
	};

	// Deep link: open to a specific ministry
	useEffect(() => {
		const ministryId = route.params?.ministryId;
		if (ministryId && ministries?.length) {
			const ministry = ministries.find(
				(m) =>
					m.id === ministryId || String(m.id) === String(ministryId),
			);
			if (ministry) {
				setSelectedMinistry(ministry);
				setMinistryValue(ministry.id);
				fetchCheckInStatus(ministry.id);
			}
		}
	}, [route.params?.ministryId, ministries]);

	useEffect(() => {
		// Only fetch on initial load when no deep link
		if (!route.params?.ministryId && selectedMinistry?.id) {
			fetchCheckInStatus(selectedMinistry.id);
		}
	}, []);

	// Fetch ministry detail (requireQrCheckout) and guardian check-in status
	useEffect(() => {
		if (!selectedMinistry?.id) return;
		let cancelled = false;
		(async () => {
			try {
				const [detail, status] = await Promise.all([
					ministryApi.getMinistry(selectedMinistry.id),
					checkInsApi
						.getCheckInStatus(selectedMinistry.id)
						.catch(() => null),
				]);
				if (!cancelled) {
					setMinistryDetail(detail || null);
					setGuardianCheckInStatus(status || null);
					// Merge any checkout tokens from status (single checkIn or checkIns array)
					if (status) {
						setCheckoutTokensByAttendee((prev) => {
							const next = { ...prev };
							if (status.checkIn?.checkoutToken) {
								const key =
									status.checkIn.userId ??
									status.checkIn.familyMemberId ??
									user?.id;
								if (key != null)
									next[key] = status.checkIn.checkoutToken;
							}
							(status.checkIns || []).forEach((ci) => {
								if (ci.checkoutToken) {
									const key = ci.userId ?? ci.familyMemberId;
									if (key != null)
										next[key] = ci.checkoutToken;
								}
							});
							return next;
						});
					}
				}
			} catch (e) {
				if (!cancelled) setMinistryDetail(null);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [selectedMinistry?.id]);

	useEffect(() => {
		if (selectedMinistry?.id) {
			setMinistryValue(selectedMinistry.id);
		}
	}, [selectedMinistry]);

	useEffect(() => {
		// Set up the items for the dropdown
		const items = ministries.map((ministry) => ({
			label: ministry.name,
			value: ministry.id,
		}));
		setMinistryItems(items);
	}, [ministries]);

	if (!user || !organization) {
		return null;
	}

	const handleMinistryChange = (ministryId) => {
		// Find the full ministry object based on the ID
		const ministry = ministries.find((m) => m.id === ministryId);
		if (ministry) {
			setSelectedMinistry(ministry); // Pass the full ministry object
			fetchCheckInStatus(ministryId);
		}
	};

	const toggleMemberSelection = (memberId) => {
		setSelectedMemberIds((prevIds) =>
			prevIds.includes(memberId)
				? prevIds.filter((id) => id !== memberId)
				: [...prevIds, memberId],
		);
	};

	const handleCheckIn = async () => {
		try {
			setLoading(true);

			// First handle the current user separately
			const userSelections = selectedMemberIds.includes(user.id)
				? [user.id]
				: [];

			// Then handle family connections
			const selectedMembers = familyMembers.activeConnections.filter(
				(member) => selectedMemberIds.includes(member.id),
			);

			// Add any real users from family connections
			const realUserSelections = [
				...userSelections,
				...selectedMembers
					.filter((member) => member.isRealUser)
					.map((member) => member.id),
			];

			// Get family members (non-real users)
			const familyMemberSelections = selectedMembers
				.filter((member) => !member.isRealUser)
				.map((member) => member.id);

			// Calculate which users/members need to be checked in/out
			const usersToCheckIn = realUserSelections.filter(
				(id) => !checkedInUserIds.includes(id),
			);
			let usersToCheckOut = checkedInUserIds.filter(
				(id) => !realUserSelections.includes(id),
			);

			// Only handle check-in/out for family members that are in active connections
			const activeConnectionIds = new Set(
				familyMembers.activeConnections.map((m) => m.id),
			);
			const membersToCheckIn = familyMemberSelections.filter(
				(id) =>
					!checkedInMemberIds.includes(id) &&
					activeConnectionIds.has(id),
			);
			let membersToCheckOut = checkedInMemberIds.filter(
				(id) =>
					!familyMemberSelections.includes(id) ||
					!activeConnectionIds.has(id),
			);

			// When ministry requires QR checkout, only staff can check out via scan; disable UI checkout
			const requireQrCheckout =
				ministryDetail?.requireQrCheckout ?? false;
			if (requireQrCheckout) {
				usersToCheckOut = [];
				membersToCheckOut = [];
			}

			let changesOccurred = false;

			// Combine all check-ins into a single request
			if (usersToCheckIn.length > 0 || membersToCheckIn.length > 0) {
				try {
					const checkInPayload = {
						checkIns: [
							{
								userIds: usersToCheckIn,
								familyMemberIds: membersToCheckIn,
							},
						],
					};

					console.log('Checking in with payload:', checkInPayload);

					const response = await checkInsApi.checkIn(
						selectedMinistry.id,
						checkInPayload.checkIns[0].userIds,
						checkInPayload.checkIns[0].familyMemberIds,
					);
					console.log('Check-in response:', response);
					changesOccurred = true;
					// Store checkout tokens for QR pickup (Flow A); backend only returns when ministry requires QR
					if (response?.checkIns?.length) {
						setCheckoutTokensByAttendee((prev) => {
							const next = { ...prev };
							response.checkIns.forEach((ci) => {
								if (ci.checkoutToken) {
									const key = ci.userId ?? ci.familyMemberId;
									if (key != null)
										next[key] = ci.checkoutToken;
								}
							});
							return next;
						});
					}
				} catch (error) {
					console.error('Failed to check in:', error);
					console.error('Error response:', error.response?.data);
					throw error;
				}
			}

			// Handle check-outs similarly
			if (usersToCheckOut.length > 0 || membersToCheckOut.length > 0) {
				const checkOutPayload = {
					checkIns: [
						{
							userIds: usersToCheckOut,
							familyMemberIds: membersToCheckOut,
						},
					],
				};

				console.log('Checking out with payload:', checkOutPayload);

				await checkInsApi.checkOut(
					selectedMinistry.id,
					checkOutPayload.checkIns[0].userIds,
					checkOutPayload.checkIns[0].familyMemberIds,
				);
				changesOccurred = true;
			}

			if (changesOccurred) {
				if (usersToCheckIn.length > 0 || membersToCheckIn.length > 0) {
					setShowConfetti(true);
					setTimeout(() => {
						setShowConfetti(false);
					}, 5000);
				}
				await fetchCheckInStatus(selectedMinistry.id);
				const status = await checkInsApi
					.getCheckInStatus(selectedMinistry.id)
					.catch(() => null);
				if (status) setGuardianCheckInStatus(status);
			}
		} catch (error) {
			console.error('Check-in/out failed:', error);
			await fetchCheckInStatus(selectedMinistry.id);
		} finally {
			setLoading(false);
		}
	};

	const selectedMinistryObj =
		ministries.find(
			(m) =>
				m.id === selectedMinistry?.id ||
				m.name === selectedMinistry?.name,
		) ?? selectedMinistry;
	const isMinistryActive = selectedMinistryObj?.isActive ?? true;
	const requireQrCheckout = ministryDetail?.requireQrCheckout ?? false;

	const getTokenForMember = (memberId, isCurrentUser) =>
		checkoutTokensByAttendee[memberId] ??
		(isCurrentUser ? guardianCheckInStatus?.checkIn?.checkoutToken : null);

	// Build ordered list of pickup QR items (current user first, then family) for swipeable drawer
	const getPickupQRItems = () => {
		const allMembers = [
			{
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				isCurrentUser: true,
			},
			...(familyMembers?.activeConnections || []).map((m) => ({
				...m,
				isCurrentUser: false,
			})),
		];
		const items = [];
		allMembers.forEach((member) => {
			const isCheckedIn = member.isCurrentUser
				? checkedInUserIds.includes(member.id)
				: checkedInMemberIds.includes(member.id);
			if (!isCheckedIn) return;
			const token = getTokenForMember(member.id, member.isCurrentUser);
			if (!token) return;
			const attendeeName = member.isCurrentUser
				? 'Your pickup code'
				: `${member.firstName} ${member.lastName}`;
			const ministryId = selectedMinistry?.id ?? selectedMinistryObj?.id;
			const payload =
				ministryId != null
					? `assemblie://checkout?ministryId=${encodeURIComponent(ministryId)}&token=${encodeURIComponent(token)}`
					: token;
			items.push({ token, attendeeName, payload });
		});
		return items;
	};

	const handleShowPickupQR = (token, attendeeName) => {
		if (!token) return;
		const items = getPickupQRItems();
		const idx = items.findIndex(
			(item) =>
				item.token === token ||
				(item.attendeeName && item.attendeeName === attendeeName),
		);
		setPickupQRModal({
			visible: true,
			initialIndex: idx >= 0 ? idx : 0,
		});
	};

	const handleAddFamilyMember = async () => {
		try {
			if (!newMember.firstName || !newMember.lastName) {
				console.error('First name and last name are required');
				return;
			}

			const response = await familyMembersApi.create(newMember);

			setNewMember({ firstName: '', lastName: '', userPhoto: '' });
			setModalVisible(false);

			if (selectedMinistry) {
				await fetchCheckInStatus(selectedMinistry.id);
			}
		} catch (error) {
			console.error('Error adding family member:', error);
			// Add appropriate error handling/user feedback here
		}
	};

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		if (!result.canceled) {
			setNewMember((prev) => ({
				...prev,
				userPhoto: result.assets[0].uri,
			}));
		}
	};

	const renderMemberCards = () => {
		// Filter to only show user and accepted family members
		const allMembers = [
			{
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				userPhoto: user.userPhoto,
				isCurrentUser: true,
			},
			...(familyMembers?.activeConnections || []).map((member) => ({
				...member,
				isCurrentUser: false,
			})),
		];

		return allMembers.map((member, index) => {
			const isCheckedIn = member.isCurrentUser
				? checkedInUserIds.includes(member.id)
				: checkedInMemberIds.includes(member.id);

			const isSelected = selectedMemberIds.includes(member.id);

			return (
				<TouchableOpacity
					key={index}
					style={[
						styles.memberCard,
						{
							backgroundColor: lightenColor(
								organization.primaryColor,
							),
							borderColor: organization.primaryColor,
						},
						isSelected && [
							styles.selectedCard,
							{
								backgroundColor: organization.secondaryColor,
								borderColor: organization.primaryColor,
							},
						],
					]}
					onPress={() => {
						// When QR checkout is required, don't allow deselecting checked-in members (checkout only via staff scan)
						if (requireQrCheckout && isCheckedIn && isSelected)
							return;
						toggleMemberSelection(member.id);
					}}>
					{isSelected && (
						<View style={styles.checkmarkContainer}>
							<Ionicons
								name='checkmark-circle'
								size={24}
								color={organization.primaryColor}
							/>
						</View>
					)}
					<View style={styles.photoContainer}>
						<Image
							source={
								member.userPhoto &&
								member.userPhoto.trim &&
								member.userPhoto.trim() !== ''
									? { uri: member.userPhoto }
									: require('../../../assets/Assemblie_DefaultUserIcon.png')
							}
							style={styles.photo}
							resizeMode='cover'
						/>
					</View>
					<Text style={styles.memberName}>
						{`${member.firstName} ${member.lastName}`}
						{member.isCurrentUser ? ' (You)' : ''}
					</Text>
					{isCheckedIn && (
						<View style={styles.checkedInRow}>
							<Text style={styles.checkedInText}>Checked In</Text>
							{requireQrCheckout &&
								getTokenForMember(
									member.id,
									member.isCurrentUser,
								) && (
									<TouchableOpacity
										style={styles.qrIconButton}
										onPress={() =>
											handleShowPickupQR(
												getTokenForMember(
													member.id,
													member.isCurrentUser,
												),
												`${member.firstName} ${member.lastName}`,
											)
										}
										hitSlop={{
											top: 8,
											bottom: 8,
											left: 8,
											right: 8,
										}}>
										<Ionicons
											name='qr-code-outline'
											size={24}
											color={organization.primaryColor}
										/>
									</TouchableOpacity>
								)}
						</View>
					)}
				</TouchableOpacity>
			);
		});
	};

	const renderModal = () => (
		<Modal
			animationType='slide'
			transparent={true}
			visible={modalVisible}
			onRequestClose={() => setModalVisible(false)}>
			<View style={styles.modalContainer}>
				<View
					style={[
						styles.modalContent,
						{
							backgroundColor: lightenColor(
								organization.primaryColor,
							),
						},
					]}>
					<Text
						style={[
							styles.modalHeader,
							{ color: organization.secondaryColor },
						]}>
						Add Family Member
					</Text>

					<TouchableOpacity
						style={styles.imagePickerButton}
						onPress={pickImage}>
						{newMember.userPhoto ? (
							<Image
								source={{ uri: newMember.userPhoto }}
								style={styles.previewImage}
							/>
						) : (
							<Text
								style={{ color: organization.secondaryColor }}>
								Select Photo
							</Text>
						)}
					</TouchableOpacity>

					<TextInput
						style={[
							styles.input,
							{ borderColor: organization.secondaryColor },
						]}
						placeholder='First Name'
						value={newMember.firstName}
						onChangeText={(text) =>
							setNewMember((prev) => ({
								...prev,
								firstName: text,
							}))
						}
					/>
					<TextInput
						style={[
							styles.input,
							{ borderColor: organization.secondaryColor },
						]}
						placeholder='Last Name'
						value={newMember.lastName}
						onChangeText={(text) =>
							setNewMember((prev) => ({
								...prev,
								lastName: text,
							}))
						}
					/>

					<View style={styles.modalButtons}>
						<Button
							type='secondary'
							text='Cancel'
							onPress={() => setModalVisible(false)}
						/>
						<Button
							type='primary'
							text='Add Member'
							onPress={handleAddFamilyMember}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);

	const renderMinistryPicker = () => (
		<DropDownPicker
			open={open}
			value={ministryValue}
			items={ministryItems}
			setOpen={setOpen}
			setValue={setMinistryValue}
			onSelectItem={(item) => {
				handleMinistryChange(item.value);
			}}
			setItems={setMinistryItems}
			style={[
				styles.dropdownStyle,
				{ backgroundColor: lightenColor(organization.primaryColor) },
			]}
			textStyle={styles.dropdownText}
			dropDownContainerStyle={[
				styles.dropdownContainer,
				{ backgroundColor: lightenColor(organization.primaryColor) },
			]}
			placeholder='Select Ministry'
			zIndex={3000}
			zIndexInverse={1000}
			listMode='SCROLLVIEW'
			scrollViewProps={{ nestedScrollEnabled: true }}
		/>
	);

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			{renderModal()}
			<PickupQRDrawer
				visible={pickupQRModal.visible}
				onRequestClose={() =>
					setPickupQRModal({ visible: false, initialIndex: 0 })
				}
				items={getPickupQRItems()}
				initialIndex={pickupQRModal.initialIndex}
				primaryColor={organization.primaryColor}
				secondaryColor={organization.secondaryColor}
			/>
			<SafeAreaView style={styles.container}>
				<ScrollView
					style={styles.scrollContainer}
					nestedScrollEnabled={true}>
					<Text
						style={[
							styles.header,
							{ color: organization.secondaryColor },
						]}>
						Check In
					</Text>
					<Text
						style={[
							styles.subheader,
							{ color: organization.secondaryColor },
						]}>
						Select Ministry
					</Text>
					{renderMinistryPicker()}

					{!isMinistryActive &&
						selectedMinistryObj?.inactiveMessage && (
							<Text
								style={[
									styles.inactiveWarning,
									{
										color: lightenColor(
											organization.secondaryColor,
											50,
										),
									},
								]}>
								{selectedMinistryObj.inactiveMessage}
							</Text>
						)}

					{requireQrCheckout &&
						guardianCheckInStatus?.checkIn?.checkoutToken && (
							<View style={styles.showPickupQRSection}>
								<Text
									style={[
										styles.sectionHeader,
										{ color: organization.secondaryColor },
									]}>
									Pickup QR
								</Text>
								<Text
									style={[
										styles.caption,
										{ color: organization.secondaryColor },
									]}>
									One QR per person. Staff will scan once per
									child at pickup. Tap below to show your QR,
									or use the QR icon on each checked-in
									person’s card for their code.
								</Text>
								<TouchableOpacity
									style={[
										styles.showQRButton,
										{
											backgroundColor: lightenColor(
												organization.primaryColor,
											),
										},
									]}
									onPress={() =>
										handleShowPickupQR(
											guardianCheckInStatus.checkIn
												.checkoutToken,
											'Your pickup code',
										)
									}>
									<Ionicons
										name='qr-code-outline'
										size={28}
										color={organization.primaryColor}
									/>
									<Text
										style={[
											styles.showQRButtonText,
											{
												color: organization.primaryColor,
											},
										]}>
										Show pickup QR
									</Text>
								</TouchableOpacity>
							</View>
						)}

					<Text
						style={[
							styles.sectionHeader,
							{ color: organization.secondaryColor },
						]}>
						Who's checking in?
					</Text>
					<View style={styles.gridContainer}>
						{renderMemberCards()}
					</View>

					<Button
						type='primary'
						primaryColor={
							isMinistryActive
								? organization.primaryColor
								: 'gray'
						}
						text={
							isMinistryActive
								? 'Complete Check In'
								: 'Ministry Inactive'
						}
						onPress={handleCheckIn}
						disabled={!isMinistryActive}
					/>

					{showConfetti && (
						<ConfettiCannon
							count={200}
							origin={{ x: -10, y: 0 }}
							autoStart={true}
							fadeOut={true}
							explosionSpeed={350}
							fallSpeed={3000}
							colors={[
								organization.primaryColor,
								organization.secondaryColor,
							]}
						/>
					)}
				</ScrollView>
			</SafeAreaView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		padding: 20,
	},
	header: {
		...typography.h1,
		marginBottom: 24,
		textAlign: 'center',
	},
	subheader: {
		...typography.h3,
		marginBottom: 12,
	},
	sectionHeader: {
		...typography.h2,
		marginTop: 24,
		marginBottom: 16,
		textAlign: 'left',
	},
	pickerContainer: {
		borderRadius: 8,
		marginBottom: 16,
		overflow: 'hidden',
		minHeight: 60,
	},
	picker: {
		height: 60,
		width: '100%',
		paddingVertical: 8,
	},
	pickerItem: {
		...typography.body,
		height: 60,
		lineHeight: 24,
	},
	inactiveWarning: {
		...typography.body,
		textAlign: 'center',
		marginVertical: 12,
		fontStyle: 'italic',
	},
	gridContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	memberCard: {
		width: '48%',
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 2,
		alignItems: 'center',
		position: 'relative',
	},
	selectedCard: {
		borderWidth: 2,
	},
	checkmarkContainer: {
		position: 'absolute',
		top: 8,
		right: 8,
		zIndex: 1,
	},
	photoContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		overflow: 'hidden',
		marginBottom: 8,
	},
	photo: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	memberName: {
		...typography.bodyMedium,
		textAlign: 'center',
		marginBottom: 4,
	},
	checkedInRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	checkedInText: {
		...typography.caption,
		color: '#4CAF50',
		textAlign: 'center',
	},
	qrIconButton: {
		padding: 4,
	},
	showPickupQRSection: {
		marginBottom: 20,
	},
	caption: {
		...typography.caption,
		marginBottom: 8,
	},
	showQRButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 14,
		borderRadius: 12,
		gap: 10,
	},
	showQRButtonText: {
		...typography.bodyMedium,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: 20,
	},
	modalContent: {
		width: '100%',
		padding: 20,
		borderRadius: 12,
		alignItems: 'center',
	},
	modalHeader: {
		...typography.h2,
		marginBottom: 20,
	},
	input: {
		width: '100%',
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 16,
		paddingHorizontal: 12,
		backgroundColor: 'white',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginTop: 20,
	},
	imagePickerButton: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#f0f0f0',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	previewImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
	},
	dropdownStyle: {
		borderWidth: 0,
		borderRadius: 8,
		minHeight: 60,
	},
	dropdownText: {
		...typography.body,
		color: '#000000',
	},
	dropdownContainer: {
		borderWidth: 0,
		borderRadius: 8,
	},
});

export default CheckInScreen;
