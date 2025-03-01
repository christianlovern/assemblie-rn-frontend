import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	TextInput,
	Linking,
	TouchableOpacity,
	Modal,
	Dimensions,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import { MaterialCommunityIcons as CommunityIcon } from 'react-native-vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { users, teams, teamUsers } from '../../../dummyData';

const { width, height } = Dimensions.get('window');

const ContactScreen = () => {
	const { user, organization } = useData();
	const [activeTab, setActiveTab] = useState('church');
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [expandedTeams, setExpandedTeams] = useState(new Set());
	const [teamSearchQuery, setTeamSearchQuery] = useState('');

	useEffect(() => {
		const filtered = users
			.filter((u) => u.visibility !== 'hidden')
			.filter((u) =>
				`${u.firstName} ${u.lastName}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
			)
			.sort((a, b) => {
				// First compare last names
				const lastNameCompare = a.lastName
					.toLowerCase()
					.localeCompare(b.lastName.toLowerCase());

				// If last names are the same, compare first names
				if (lastNameCompare === 0) {
					return a.firstName
						.toLowerCase()
						.localeCompare(b.firstName.toLowerCase());
				}

				return lastNameCompare;
			});

		setFilteredUsers(filtered);
	}, [searchQuery]);

	const userData = {
		firstName: user.firstName ? user.firstName : '',
		lastName: user.lastName ? user.lastName : '',
		email: user.email ? user.email : '',
		phone: user.phoneNumber ? user.phoneNumber : '',
	};

	const handlePhonePress = (phoneNumber) => {
		Linking.openURL(`tel:${phoneNumber}`);
	};

	const handleWebsitePress = (website) => {
		Linking.openURL(website);
	};

	const handleAddressPress = () => {
		const address = `${organization.addressOne}, ${organization.city}, ${organization.state} ${organization.zipCode}`;
		const encodedAddress = encodeURIComponent(address);
		Linking.openURL(`https://maps.google.com?q=${encodedAddress}`);
	};

	const handleSocialPress = (platform, handle) => {
		switch (platform) {
			case 'facebook':
				// Try to open Facebook app first, fallback to web
				Linking.openURL(`fb://page/${handle}`).catch(() => {
					Linking.openURL(`https://www.facebook.com/${handle}`);
				});
				break;
			case 'instagram':
				// Try to open Instagram app first, fallback to web
				Linking.openURL(`instagram://user?username=${handle}`).catch(
					() => {
						Linking.openURL(`https://www.instagram.com/${handle}`);
					}
				);
				break;
			case 'twitter':
				// Try to open X/Twitter app first, fallback to web
				Linking.openURL(`twitter://user?screen_name=${handle}`).catch(
					() => {
						Linking.openURL(`https://twitter.com/${handle}`);
					}
				);
				break;
		}
	};

	const getFilteredTeams = () => {
		const searchLower = teamSearchQuery.toLowerCase();

		// First, get all teams that match the search query
		const matchingTeams = teams.filter((team) =>
			team.name.toLowerCase().includes(searchLower)
		);

		// Get all team IDs that have matching users
		const teamsWithMatchingUsers = teamUsers
			.filter((tu) => {
				const user = users.find((u) => u.id === tu.userId);
				return (
					user &&
					`${user.firstName} ${user.lastName}`
						.toLowerCase()
						.includes(searchLower)
				);
			})
			.map((tu) => tu.teamId);

		// Combine and deduplicate results
		const matchingTeamIds = new Set([
			...matchingTeams.map((t) => t.id),
			...teamsWithMatchingUsers,
		]);

		return teams.filter((team) => matchingTeamIds.has(team.id));
	};

	const getTeamUsers = (teamId) => {
		return teamUsers
			.filter((tu) => tu.teamId === teamId && tu.isActive)
			.map((tu) => {
				const user = users.find((u) => u.id === tu.userId);
				return {
					...user,
					isTeamLead: tu.isTeamLead,
				};
			})
			.sort((a, b) => {
				// Team leads first, then alphabetical by last name
				if (a.isTeamLead !== b.isTeamLead) {
					return a.isTeamLead ? -1 : 1;
				}
				return a.lastName.localeCompare(b.lastName);
			});
	};

	const toggleTeam = (teamId) => {
		const newExpanded = new Set(expandedTeams);
		if (newExpanded.has(teamId)) {
			newExpanded.delete(teamId);
		} else {
			newExpanded.add(teamId);
		}
		setExpandedTeams(newExpanded);
	};

	const renderTeamMember = (user) => (
		<View
			key={user.id}
			style={styles.teamMemberCard}>
			<Image
				source={user.userPhoto}
				style={styles.userPhoto}
			/>
			<View style={styles.teamMemberInfo}>
				<Text style={styles.userName}>
					{`${user.firstName} ${user.lastName}`}
					{user.isTeamLead && ' (Team Lead)'}
				</Text>
			</View>
		</View>
	);

	const renderChurchInfo = () => {
		return (
			<View style={{ marginLeft: '10%', marginTop: '25%' }}>
				<View style={{ flexDirection: 'row' }}>
					<Image
						source={require('../../../assets/dummy-org-logo.jpg')}
						style={styles.userIcon}
					/>
					<View
						style={{
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Text
							style={
								styles.headerText
							}>{`${organization.name}`}</Text>
					</View>
				</View>

				<View style={{ marginTop: '10%' }}>
					{organization.phoneNumber && (
						<TouchableOpacity
							style={styles.infoRow}
							onPress={() =>
								handlePhonePress(organization.phoneNumber)
							}>
							<Icon
								name='phone'
								size={24}
								color='white'
							/>
							<Text style={styles.contentText}>
								{organization.phoneNumber}
							</Text>
						</TouchableOpacity>
					)}

					{organization.addressOne && (
						<TouchableOpacity
							style={styles.infoRow}
							onPress={handleAddressPress}>
							<Icon
								name='location-on'
								size={24}
								color='white'
							/>
							<View>
								<Text style={styles.contentText}>
									{organization.addressOne}
								</Text>
								{organization.addressTwo && (
									<Text style={styles.contentText}>
										{organization.addressTwo}
									</Text>
								)}
								<Text style={styles.contentText}>
									{`${organization.city}, ${organization.state} ${organization.zipCode}`}
								</Text>
							</View>
						</TouchableOpacity>
					)}

					{organization.website && (
						<TouchableOpacity
							style={styles.infoRow}
							onPress={() =>
								handleWebsitePress(organization.website)
							}>
							<Icon
								name='language'
								size={24}
								color='white'
							/>
							<Text style={styles.contentText}>
								{organization.website}
							</Text>
						</TouchableOpacity>
					)}

					{organization.facebook && (
						<TouchableOpacity
							style={styles.infoRow}
							onPress={() =>
								handleSocialPress(
									'facebook',
									organization.facebook
								)
							}>
							<CommunityIcon
								name='facebook'
								size={24}
								color='white'
							/>
							<Text style={styles.contentText}>
								{organization.facebook}
							</Text>
						</TouchableOpacity>
					)}

					{organization.instagram && (
						<TouchableOpacity
							style={styles.infoRow}
							onPress={() =>
								handleSocialPress(
									'instagram',
									organization.instagram
								)
							}>
							<CommunityIcon
								name='instagram'
								size={24}
								color='white'
							/>
							<Text style={styles.contentText}>
								{organization.instagram}
							</Text>
						</TouchableOpacity>
					)}

					{organization.x && (
						<TouchableOpacity
							style={styles.infoRow}
							onPress={() =>
								handleSocialPress('twitter', organization.x)
							}>
							<CommunityIcon
								name='twitter'
								size={24}
								color='white'
							/>
							<Text style={styles.contentText}>
								{organization.x}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		);
	};

	const renderUserModal = () => (
		<Modal
			animationType='slide'
			transparent={true}
			visible={modalVisible}
			onRequestClose={() => {
				setModalVisible(false);
				setSelectedUser(null);
			}}>
			<TouchableOpacity
				style={styles.modalOverlay}
				activeOpacity={1}
				onPress={() => {
					setModalVisible(false);
					setSelectedUser(null);
				}}>
				<View
					style={[
						styles.modalContent,
						{ backgroundColor: organization.primaryColor },
					]}>
					<TouchableOpacity
						style={styles.modalCard}
						activeOpacity={1}
						onPress={() => {}} // Prevents modal from closing when card is tapped
					>
						<Image
							source={selectedUser?.userPhoto}
							style={styles.modalUserPhoto}
						/>
						<Text style={styles.modalUserName}>
							{selectedUser
								? `${selectedUser.firstName} ${selectedUser.lastName}`
								: ''}
						</Text>
						{selectedUser?.visibility === 'public' &&
							selectedUser?.phoneNumber && (
								<TouchableOpacity
									onPress={() =>
										handlePhonePress(
											selectedUser.phoneNumber
										)
									}
									style={styles.modalPhoneContainer}>
									<Icon
										name='phone'
										size={24}
										color='white'
									/>
									<Text style={styles.modalPhoneText}>
										{selectedUser.phoneNumber}
									</Text>
								</TouchableOpacity>
							)}
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		</Modal>
	);

	const renderUserCard = (user) => (
		<TouchableOpacity
			key={user.id}
			style={styles.userCard}
			onPress={() => {
				setSelectedUser(user);
				setModalVisible(true);
			}}>
			<Image
				source={user.userPhoto}
				style={styles.userPhoto}
			/>
			<View style={styles.userInfo}>
				<Text
					style={
						styles.userName
					}>{`${user.firstName} ${user.lastName}`}</Text>
				{user.visibility === 'public' && (
					<Text style={styles.userPhone}>{user.phoneNumber}</Text>
				)}
			</View>
		</TouchableOpacity>
	);

	const renderDirectory = () => (
		<View style={styles.directoryContainer}>
			<TextInput
				style={styles.searchBar}
				placeholder='Search by name...'
				placeholderTextColor='white'
				value={searchQuery}
				onChangeText={setSearchQuery}
			/>
			<ScrollView style={styles.userList}>
				{filteredUsers.map(renderUserCard)}
			</ScrollView>
		</View>
	);

	const renderTeams = () => (
		<View style={styles.teamsContainer}>
			<TextInput
				style={styles.searchBar}
				placeholder='Search teams or members...'
				placeholderTextColor='white'
				value={teamSearchQuery}
				onChangeText={setTeamSearchQuery}
			/>
			<ScrollView style={styles.teamsList}>
				{getFilteredTeams().map((team) => (
					<View
						key={team.id}
						style={styles.teamSection}>
						<TouchableOpacity
							style={styles.teamHeader}
							onPress={() => toggleTeam(team.id)}>
							<View style={styles.teamHeaderContent}>
								<Text style={styles.teamName}>{team.name}</Text>
								<Icon
									name={
										expandedTeams.has(team.id)
											? 'expand-less'
											: 'expand-more'
									}
									size={24}
									color='white'
								/>
							</View>
							<Text style={styles.teamDescription}>
								{team.description}
							</Text>
						</TouchableOpacity>
						{expandedTeams.has(team.id) && (
							<View style={styles.teamMembers}>
								{getTeamUsers(team.id).map(renderTeamMember)}
							</View>
						)}
					</View>
				))}
			</ScrollView>
		</View>
	);

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<View style={styles.filterContainer}>
					<Button
						type={activeTab === 'church' ? 'primary' : 'hollow'}
						text='Church'
						primaryColor={organization.primaryColor}
						onPress={() => setActiveTab('church')}
						style={styles.filterButton}
					/>
					<Button
						type={activeTab === 'directory' ? 'primary' : 'hollow'}
						text='Directory'
						primaryColor={organization.primaryColor}
						onPress={() => setActiveTab('directory')}
						style={styles.filterButton}
					/>
					<Button
						type={activeTab === 'teams' ? 'primary' : 'hollow'}
						text='Teams'
						primaryColor={organization.primaryColor}
						onPress={() => setActiveTab('teams')}
						style={styles.filterButton}
					/>
				</View>

				{activeTab === 'church' && renderChurchInfo()}
				{activeTab === 'directory' && renderDirectory()}
				{activeTab === 'teams' && renderTeams()}
				{renderUserModal()}
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: '10%',
		alignItems: 'center',
	},
	text: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	headerText: {
		fontSize: 22,
		color: 'white',
		fontWeight: 'bold',
		justifyContent: 'center',
		alignSelf: 'center',
		marginLeft: '2%',
	},
	subHeaderText: {
		fontSize: 18,
		color: 'white',
		justifyContent: 'center',
		alignSelf: 'center',
		marginTop: '2%',
	},
	contentText: {
		fontSize: 18,
		color: 'white',
		marginLeft: 12,
	},
	userIcon: {
		width: 125,
		height: 125,
		resizeMode: 'contain',
		marginRight: 10,
		borderRadius: 50,
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
		gap: 8,
		marginTop: '8%',
		paddingHorizontal: 16,
	},
	filterButton: {
		minWidth: '25%',
		minHeight: 45,
		paddingHorizontal: 15,
	},
	directoryContainer: {
		flex: 1,
		width: '100%',
	},
	searchBar: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 8,
		padding: 12,
		color: 'white',
		marginBottom: 16,
		marginHorizontal: 16,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	userList: {
		flex: 1,
		paddingHorizontal: 16,
	},
	userCard: {
		flexDirection: 'row',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
	},
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: 25,
	},
	userInfo: {
		marginLeft: 12,
		justifyContent: 'center',
	},
	userName: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	userPhone: {
		color: 'white',
		fontSize: 14,
		marginTop: 4,
	},
	teamsContainer: {
		flex: 1,
		width: '100%',
	},
	teamsList: {
		flex: 1,
		paddingHorizontal: 16,
	},
	teamSection: {
		marginBottom: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		overflow: 'hidden',
	},
	teamHeader: {
		padding: 16,
	},
	teamHeaderContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	teamName: {
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
	},
	teamDescription: {
		color: 'white',
		fontSize: 14,
		marginTop: 4,
		opacity: 0.8,
	},
	teamMembers: {
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	teamMemberCard: {
		flexDirection: 'row',
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	teamMemberInfo: {
		marginLeft: 12,
		justifyContent: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: width * 0.85,
		minHeight: height * 0.5,
		borderRadius: 15,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalCard: {
		width: '100%',
		alignItems: 'center',
		padding: 20,
	},
	modalUserPhoto: {
		width: width * 0.4,
		height: width * 0.4,
		borderRadius: (width * 0.4) / 2,
		marginBottom: 20,
	},
	modalUserName: {
		color: 'white',
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 16,
	},
	modalPhoneContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		padding: 8,
	},
	modalPhoneText: {
		color: 'white',
		fontSize: 18,
		marginLeft: 12,
	},
});

export default ContactScreen;
