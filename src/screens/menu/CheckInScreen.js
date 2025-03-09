import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useData } from '../../../context';
import Background from '../../../shared/components/Background';
import Button from '../../../shared/buttons/Button';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { checkInsApi } from '../../../api/checkInRoutes';

const CheckInScreen = () => {
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

	console.log('Selected Ministry AT TOP:', selectedMinistry);

	const fetchCheckInStatus = async (ministryId) => {
		try {
			setLoading(true);
			const allCheckIns = await checkInsApi.getAllForMinistry(ministryId);
			console.log('All check-ins:', allCheckIns);

			const today = new Date().toISOString().split('T')[0];

			const todayCheckIns = allCheckIns.checkIns.find(
				(checkIn) => checkIn.date === today
			) || { users: [], familyMembers: [] };

			console.log("Today's check-ins:", todayCheckIns);

			// Extract user and family member IDs
			const userIds = todayCheckIns.users.map((user) => user.id);
			const familyMemberIds = todayCheckIns.familyMembers.map(
				(member) => member.id
			);

			console.log('Processing check-in status:', {
				userIds,
				familyMemberIds,
				selectedMemberIds,
				date: today,
				currentUserId: user.id,
			});

			// Update states
			setCheckedInUserIds(userIds);
			setCheckedInMemberIds(familyMemberIds);

			// Update selected members to match check-in status
			const newSelectedIds = [...selectedMemberIds];

			// Remove any IDs that aren't checked in anymore
			const allCheckedInIds = [...userIds, ...familyMemberIds];
			newSelectedIds.forEach((id, index) => {
				if (!allCheckedInIds.includes(id)) {
					newSelectedIds.splice(index, 1);
				}
			});

			// Add any newly checked in IDs
			allCheckedInIds.forEach((id) => {
				if (!newSelectedIds.includes(id)) {
					newSelectedIds.push(id);
				}
			});

			setSelectedMemberIds(newSelectedIds);
		} catch (error) {
			console.error('Failed to fetch check-in status:', error);
		} finally {
			setLoading(false);
		}
	};

	// Add this useEffect to help debug state changes
	useEffect(() => {
		console.log('State updated:', {
			checkedInUserIds,
			checkedInMemberIds,
			selectedMemberIds,
			familyMemberIds: familyMembers.familyMembers.map((m) => m.id),
			currentUserId: user.id,
		});
	}, [checkedInUserIds, checkedInMemberIds, selectedMemberIds]);

	useEffect(() => {
		const ministry = ministries.find((m) => m.name === selectedMinistry);
		if (ministry) {
			console.log('Fetching status for ministry:', ministry.id); // Debug log
			fetchCheckInStatus(ministry.id);
		}
	}, [selectedMinistry]);

	const handleMinistryChange = (ministryId) => {
		setSelectedMinistry(ministryId);
		fetchCheckInStatus(ministryId);
	};

	const toggleMemberSelection = (memberId) => {
		setSelectedMemberIds((prevIds) =>
			prevIds.includes(memberId)
				? prevIds.filter((id) => id !== memberId)
				: [...prevIds, memberId]
		);
	};

	const handleCheckIn = async () => {
		try {
			setLoading(true);
			console.log('Ministry:', selectedMinistry, 'User:', user);
			// Handle user check-in/out
			const isUserCheckedIn = checkedInUserIds.includes(user.id);
			const isUserSelected = selectedMemberIds.includes(user.id);
			const shouldCheckInUser = isUserSelected && !isUserCheckedIn;
			const shouldCheckOutUser = !isUserSelected && isUserCheckedIn;

			// Handle family member check-in/out (explicitly exclude user ID)
			const familyMemberSelections = selectedMemberIds.filter(
				(id) => id !== user.id
			);
			const membersToCheckIn = familyMemberSelections.filter(
				(id) => !checkedInMemberIds.includes(id)
			);
			const membersToCheckOut = checkedInMemberIds.filter(
				(id) => !familyMemberSelections.includes(id)
			);
			console.log('Selected Ministry:', selectedMinistry);
			console.log('Check-in/out status:', {
				ministryId: selectedMinistry.id,
				userStatus: {
					isCheckedIn: isUserCheckedIn,
					isSelected: isUserSelected,
					shouldCheckIn: shouldCheckInUser,
					shouldCheckOut: shouldCheckOutUser,
				},
				familyMembers: {
					toCheckIn: membersToCheckIn,
					toCheckOut: membersToCheckOut,
				},
			});

			console.log('Ministry:', selectedMinistry);
			let changesOccurred = false;

			// Handle user check-in/out separately from family members
			if (shouldCheckInUser) {
				await checkInsApi.checkIn(selectedMinistry.id, [user.id], []);
				changesOccurred = true;
			} else if (shouldCheckOutUser) {
				await checkInsApi.checkOut(selectedMinistry.id, [user.id], []);
				changesOccurred = true;
			}

			// Handle family member check-ins
			if (membersToCheckIn.length > 0) {
				await checkInsApi.checkIn(
					selectedMinistry.id,
					[],
					membersToCheckIn
				);
				changesOccurred = true;
			}

			// Handle family member check-outs
			if (membersToCheckOut.length > 0) {
				await checkInsApi.checkOut(
					selectedMinistry.id,
					[],
					membersToCheckOut
				);
				changesOccurred = true;
			}

			if (changesOccurred) {
				// Show confetti for new check-ins
				if (membersToCheckIn.length > 0 || shouldCheckInUser) {
					setShowConfetti(true);
					setTimeout(() => {
						setShowConfetti(false);
					}, 5000);
				}

				// Refresh from server to ensure we're in sync
				await fetchCheckInStatus(selectedMinistry.id);
			}
		} catch (error) {
			console.error('Check-in/out failed:', error);
			await fetchCheckInStatus(selectedMinistry.id);
		} finally {
			setLoading(false);
		}
	};

	const selectedMinistryObj = ministries.find(
		(m) => m.name === selectedMinistry
	);
	const isMinistryActive = selectedMinistryObj?.isActive ?? true;

	const renderMemberCards = () => {
		const allMembers = [
			// Add current user as first card
			{
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				userPhoto: user.userPhoto,
				isCurrentUser: true,
			},
			// Add family members
			...familyMembers.familyMembers.map((member) => ({
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
								organization.primaryColor
							),
							borderColor: organization.primaryColor,
						},
						isSelected && [
							styles.selectedCard,
							{
								backgroundColor: lightenColor(
									organization.secondaryColor
								),
								borderColor: organization.primaryColor,
							},
						],
					]}
					onPress={() => toggleMemberSelection(member.id)}>
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
							source={require('../../../assets/dummy-org-logo.jpg')}
							style={styles.photo}
						/>
					</View>
					<Text style={styles.memberName}>
						{`${member.firstName} ${member.lastName}`}
						{member.isCurrentUser ? ' (You)' : ''}
					</Text>
					{isCheckedIn && (
						<Text style={styles.checkedInText}>Checked In</Text>
					)}
				</TouchableOpacity>
			);
		});
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<ScrollView style={styles.container}>
				<Text style={styles.header}>Check In</Text>

				<Text style={styles.subheader}>Select Ministry</Text>
				<View
					style={[
						styles.pickerContainer,
						{
							backgroundColor: lightenColor(
								organization.primaryColor
							),
						},
					]}>
					<Picker
						selectedValue={selectedMinistry}
						onValueChange={handleMinistryChange}
						style={styles.picker}
						dropdownIconColor='#fff'
						mode='dropdown'>
						{ministries.map((ministry) => (
							<Picker.Item
								key={ministry.id}
								label={ministry.name}
								value={ministry.id}
								style={styles.pickerItem}
								color={organization.primaryColor}
							/>
						))}
					</Picker>
				</View>

				{!isMinistryActive && selectedMinistryObj?.inactiveMessage && (
					<Text
						style={[
							styles.inactiveWarning,
							{
								color: lightenColor(
									organization.secondaryColor,
									50
								),
							},
						]}>
						{selectedMinistryObj.inactiveMessage}
					</Text>
				)}

				<Text style={[styles.header, { textAlign: 'left' }]}>
					Who's checking in?
				</Text>
				<View style={styles.gridContainer}>{renderMemberCards()}</View>

				<Button
					type='primary'
					primaryColor={
						isMinistryActive ? organization.primaryColor : 'gray'
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
					/>
				)}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: 'transparent',
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		marginVertical: 16,
		color: 'white',
		textAlign: 'center',
	},
	subheader: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
		color: 'white',
	},
	pickerContainer: {
		borderWidth: 1,
		borderColor: '#fff',
		borderRadius: 8,
		marginBottom: 24,
		overflow: 'hidden',
		backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent background
	},
	picker: {
		color: '#fff',
		height: 50,
		width: '100%',
	},
	pickerItem: {
		fontSize: 16,
		fontWeight: '500',
		backgroundColor: 'transparent',
	},
	gridContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginVertical: 16,
	},
	memberCard: {
		width: '48%',
		aspectRatio: 1,
		borderRadius: 8,
		padding: 8,
		marginBottom: 16,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		position: 'relative',
		minHeight: 150, // Add minimum height to accommodate the status text
	},
	selectedCard: {
		borderWidth: 2,
	},
	photoContainer: {
		width: '60%',
		aspectRatio: 1,
		borderRadius: 999,
		overflow: 'hidden',
		marginBottom: 8,
	},
	photo: {
		width: '100%',
		height: '100%',
	},
	memberName: {
		textAlign: 'center',
		fontWeight: '500',
	},
	checkInButton: {
		backgroundColor: '#4040ff',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		marginVertical: 24,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	checkmarkContainer: {
		position: 'absolute',
		top: 4,
		right: 4,
		zIndex: 1,
	},
	inactiveWarning: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
		letterSpacing: 1.5,
	},
	checkedInText: {
		fontSize: 12,
		color: '#fff',
		marginTop: 4,
		fontWeight: 'bold',
	},
});

export default CheckInScreen;
