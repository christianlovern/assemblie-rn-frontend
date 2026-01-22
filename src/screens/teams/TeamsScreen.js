import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Image,
	Modal,
	Linking,
	Platform,
} from 'react-native';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Background from '../../../shared/components/Background';
import { typography } from '../../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ministryApi } from '../../../api/ministryRoutes';
import { teamsApi } from '../../../api/teamRoutes';
import { useNavigation } from '@react-navigation/native';

const TeamsScreen = () => {
	const { teams } = useData();
	const { colors } = useTheme();
	const [expandedTeams, setExpandedTeams] = useState({});
	const [checkIns, setCheckIns] = useState({});
	const [loading, setLoading] = useState({});
	const [selectedUser, setSelectedUser] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [teamPlans, setTeamPlans] = useState({});
	const navigation = useNavigation();

	const toggleTeam = async (teamId) => {
		// Find the team to get its ministryId
		const team = teams.find((t) => t.id === teamId);
		if (!team) {
			console.error('Team not found:', teamId);
			return;
		}

		// Get ministryId from the first ministry in the Ministries array
		const ministryId = team.Ministries?.[0]?.id;
		console.log('Extracted ministryId:', ministryId);

		if (!ministryId) {
			console.error('No ministryId found for team:', team);
			return;
		}

		// If we're expanding and don't have check-ins data yet, fetch it
		if (!expandedTeams[teamId] && !checkIns[ministryId]) {
			setLoading((prev) => ({ ...prev, [teamId]: true }));
			try {
				console.log(
					'About to fetch check-ins for ministryId:',
					ministryId
				);
				const response = await ministryApi.getCheckIns(ministryId);
				console.log('Check-ins response:', response);
				setCheckIns((prev) => ({
					...prev,
					[ministryId]: response.checkins,
				}));
			} catch (error) {
				console.error('Failed to fetch check-ins:', error);
				console.error('Team data:', team);
			} finally {
				setLoading((prev) => ({ ...prev, [teamId]: false }));
			}
		}

		// If we're expanding and don't have plans data yet, fetch it
		if (!expandedTeams[teamId] && !teamPlans[teamId]) {
			setLoading((prev) => ({ ...prev, [teamId]: true }));
			try {
				const data = await teamsApi.getTeamPlans(teamId, 'published');
				console.log('Fetched plans data:', {
					fullResponse: data,
					plansArray: data.plans,
					firstPlan: data.plans[0], // Log the first plan's structure if it exists
					planCount: data.plans.length,
				});
				setTeamPlans((prev) => ({
					...prev,
					[teamId]: data.plans,
				}));
			} catch (error) {
				console.error('Failed to fetch plans:', error);
			} finally {
				setLoading((prev) => ({ ...prev, [teamId]: false }));
			}
		}

		setExpandedTeams((prev) => ({
			...prev,
			[teamId]: !prev[teamId],
		}));
	};

	// Also add a debug log when the component mounts to see the full teams data
	useEffect(() => {
		console.log('All teams data:', JSON.stringify(teams, null, 2));
	}, [teams]);

	const formatPhoneNumber = (phoneNumber) => {
		if (!phoneNumber) return '';
		// Remove all non-digit characters
		const cleaned = phoneNumber.replace(/\D/g, '');
		// Check if we have a 10-digit number
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)}) ${cleaned.slice(
				3,
				6
			)}-${cleaned.slice(6)}`;
		}
		// Return original if not 10 digits
		return phoneNumber;
	};

	// Function to handle phone calls
	const handleCall = (phoneNumber) => {
		const url = `tel:${phoneNumber}`;
		Linking.canOpenURL(url)
			.then((supported) => {
				if (supported) {
					return Linking.openURL(url);
				}
				console.log('Phone calls not supported');
			})
			.catch((err) => console.error('An error occurred', err));
	};

	// Function to handle text messages
	const handleText = (phoneNumber) => {
		const url = Platform.select({
			ios: `sms:${phoneNumber}`,
			android: `sms:${phoneNumber}`,
		});
		Linking.canOpenURL(url)
			.then((supported) => {
				if (supported) {
					return Linking.openURL(url);
				}
				console.log('SMS not supported');
			})
			.catch((err) => console.error('An error occurred', err));
	};

	const ContactModal = () => (
		<Modal
			animationType='slide'
			transparent={true}
			visible={isModalVisible}
			onRequestClose={() => setIsModalVisible(false)}>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.modalContent,
						{ backgroundColor: colors.primary },
					]}>
					<Text
						style={[
							styles.modalTitle,
							{ color: colors.textWhite },
						]}>
						Contact {selectedUser?.name}
					</Text>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[
								styles.modalButton,
								{ backgroundColor: 'rgba(255, 255, 255, 0.1)' },
							]}
							onPress={() => {
								handleCall(selectedUser?.phoneNumber);
								setIsModalVisible(false);
							}}>
							<View style={styles.iconCircle}>
								<Icon
									name='phone'
									size={24}
									color={colors.textWhite}
								/>
							</View>
							<Text
								style={[
									styles.modalButtonText,
									{ color: colors.textWhite },
								]}>
								Call
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.modalButton,
								{ backgroundColor: 'rgba(255, 255, 255, 0.1)' },
							]}
							onPress={() => {
								handleText(selectedUser?.phoneNumber);
								setIsModalVisible(false);
							}}>
							<View style={styles.iconCircle}>
								<Icon
									name='message'
									size={24}
									color={colors.textWhite}
								/>
							</View>
							<Text
								style={[
									styles.modalButtonText,
									{ color: colors.textWhite },
								]}>
								Text
							</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[
							styles.cancelButton,
							{ backgroundColor: colors.error },
						]}
						onPress={() => setIsModalVisible(false)}>
						<Text
							style={[
								styles.modalButtonText,
								{ color: colors.textWhite },
							]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	const renderCheckedInPerson = ({ item }) => {
		// Use the attendee object which contains the person's details
		let name = '';
		let photo = null;
		let phoneNumber = '';

		if (item.User) {
			name = `${item.User.firstName} ${item.User.lastName}`;
			photo = item.User.userPhoto;
			phoneNumber = item.User.phoneNumber;
		} else if (item.FamilyMember) {
			name = `${item.FamilyMember.firstName} ${item.FamilyMember.lastName}`;
			photo = item.FamilyMember.userPhoto;
			// Get phone number from the associated User if it exists
			phoneNumber = item.FamilyMember.creator.phoneNumber || '';
		} else if (item.attendee) {
			name = `${item.attendee.firstName} ${item.attendee.lastName}`;
			photo = item.attendee.userPhoto;
			phoneNumber = item.User?.phoneNumber || '';
		}

		const handleUserPress = () => {
			if (phoneNumber) {
				setSelectedUser({
					name: name,
					phoneNumber: phoneNumber.replace(/\D/g, ''), // Clean the phone number
				});
				setIsModalVisible(true);
			}
		};

		return (
			<TouchableOpacity
				style={styles.checkedInUser}
				onPress={handleUserPress}>
				<Image
					source={
						photo
							? { uri: photo }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.userPhoto}
				/>
				<View style={styles.userInfo}>
					<Text
						style={[styles.userName, { color: colors.textWhite }]}>
						{name}
					</Text>
					{phoneNumber ? (
						<Text
							style={[
								styles.userPhone,
								{ color: colors.textWhite },
							]}>
							{formatPhoneNumber(phoneNumber)}
						</Text>
					) : null}
				</View>
			</TouchableOpacity>
		);
	};

	const renderPlanCard = ({ item }) => (
		<TouchableOpacity
			style={[
				styles.planCard,
				{ backgroundColor: 'rgba(255, 255, 255, 0.1)' },
			]}
			onPress={() => {
				navigation.navigate('PlanView', {
					planId: item.id,
				});
			}}>
			<Text style={[styles.planTitle, { color: colors.textWhite }]}>
				{item.mainTitle}
			</Text>
			<Text style={[styles.planDescription, { color: colors.textWhite }]}>
				{item.description}
			</Text>
			<View style={styles.planCreator}>
				<Image
					source={
						item.creator.userPhoto
							? { uri: item.creator.userPhoto }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.creatorPhoto}
				/>
				<Text style={[styles.creatorName, { color: colors.textWhite }]}>
					{`${item.creator.firstName} ${item.creator.lastName}`}
				</Text>
			</View>
		</TouchableOpacity>
	);

	const renderTeamItem = ({ item }) => {
		const isExpanded = expandedTeams[item.id];
		const ministryId = item.Ministries?.[0]?.id;
		const ministryCheckIns = checkIns[ministryId] || [];
		const plans = teamPlans[item.id] || [];
		const isLoading = loading[item.id];

		console.log('Team plans for rendering:', {
			teamId: item.id,
			plansCount: plans.length,
			plans: plans,
		});

		return (
			<View
				style={[styles.teamCard, { backgroundColor: colors.primary }]}>
				<TouchableOpacity
					style={styles.teamHeader}
					onPress={() => toggleTeam(item.id)}>
					<View style={styles.teamHeaderContent}>
						<Text style={styles.teamName}>{item.name}</Text>
						<Icon
							name={isExpanded ? 'chevron-up' : 'chevron-down'}
							size={24}
							color='white'
						/>
					</View>
					<Text style={styles.teamDescription}>
						{item.description}
					</Text>
					<Text style={styles.organizationName}>
						{item.organization?.name}
					</Text>
				</TouchableOpacity>

				{isExpanded && (
					<>
						{/* Add Plans Section */}
						<View style={styles.plansContainer}>
							<Text
								style={[
									styles.sectionTitle,
									{ color: colors.textWhite },
								]}>
								Published Plans
							</Text>
							{isLoading ? (
								<Text style={styles.loadingText}>
									Loading...
								</Text>
							) : plans.length > 0 ? (
								<FlatList
									data={plans}
									renderItem={renderPlanCard}
									keyExtractor={(plan) => plan.id.toString()}
									scrollEnabled={false}
								/>
							) : (
								<Text style={styles.noPlansText}>
									No published plans available
								</Text>
							)}
						</View>

						{/* Existing check-ins section */}
						<View style={styles.checkInsContainer}>
							<Text style={styles.checkInsTitle}>
								Currently Checked In:
							</Text>
							{isLoading ? (
								<Text style={styles.loadingText}>
									Loading...
								</Text>
							) : ministryCheckIns.length > 0 ? (
								<FlatList
									data={ministryCheckIns}
									renderItem={renderCheckedInPerson}
									keyExtractor={(item) => item.id.toString()}
									scrollEnabled={false}
								/>
							) : (
								<Text style={styles.noCheckInsText}>
									No one is currently checked in
								</Text>
							)}
						</View>
					</>
				)}
			</View>
		);
	};

	return (
		<Background
			primaryColor={colors.primary}
			secondaryColor={colors.secondary}>
			<View style={styles.container}>
				<Text style={[styles.title, { color: colors.textWhite }]}>
					My Teams
				</Text>
				<FlatList
					data={teams}
					renderItem={renderTeamItem}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={styles.listContainer}
				/>
				<ContactModal />
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	title: {
		...typography.h1,
		marginBottom: 20,
	},
	listContainer: {
		paddingBottom: 20,
	},
	teamCard: {
		padding: 15,
		borderRadius: 10,
		marginBottom: 15,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	teamHeader: {
		flex: 1,
	},
	teamHeaderContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	teamName: {
		...typography.h3,
		color: 'white',
		marginBottom: 5,
		flex: 1,
	},
	teamDescription: {
		...typography.bodyMedium,
		color: 'white',
		marginBottom: 10,
	},
	organizationName: {
		...typography.bodySmall,
		color: 'white',
		opacity: 0.8,
	},
	checkInsContainer: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.2)',
	},
	checkInsTitle: {
		...typography.h4,
		color: 'white',
		marginBottom: 10,
	},
	checkedInUser: {
		paddingVertical: 5,
		flexDirection: 'row',
		alignItems: 'center',
	},
	userPhoto: {
		width: 30,
		height: 30,
		borderRadius: 15,
		marginRight: 10,
	},
	userInfo: {
		flex: 1,
	},
	userName: {
		...typography.bodyMedium,
		color: 'white',
	},
	userPhone: {
		...typography.bodySmall,
		color: 'white',
		opacity: 0.8,
	},
	loadingText: {
		...typography.bodyMedium,
		color: 'white',
		fontStyle: 'italic',
	},
	noCheckInsText: {
		...typography.bodyMedium,
		color: 'white',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContent: {
		padding: 20,
		borderRadius: 10,
		width: '80%',
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	modalTitle: {
		...typography.h3,
		textAlign: 'center',
		marginBottom: 20,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	modalButton: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 15,
		borderRadius: 8,
		flex: 0.45,
	},
	iconCircle: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},
	modalButtonText: {
		...typography.bodyLarge,
		textAlign: 'center',
	},
	cancelButton: {
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	plansContainer: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.2)',
	},
	sectionTitle: {
		...typography.h4,
		color: 'white',
		marginBottom: 10,
	},
	planCard: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
	},
	planTitle: {
		...typography.bodyLarge,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	planDescription: {
		...typography.bodyMedium,
		marginBottom: 8,
	},
	planCreator: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	creatorPhoto: {
		width: 24,
		height: 24,
		borderRadius: 12,
		marginRight: 8,
	},
	creatorName: {
		...typography.bodySmall,
	},
	noPlansText: {
		...typography.bodyMedium,
		color: 'white',
		fontStyle: 'italic',
		opacity: 0.8,
	},
});

export default TeamsScreen;
