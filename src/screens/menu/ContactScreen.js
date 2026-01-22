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
	Alert,
	ActivityIndicator,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import InputWithIcon from '../../../shared/components/ImputWithIcon';
import Button from '../../../shared/buttons/Button';
import UserDetailDrawer from '../../../shared/components/UserDetailDrawer';
import { MaterialCommunityIcons as CommunityIcon, MaterialIcons as Icon } from '@expo/vector-icons';
import { teamsApi } from '../../../api/teamRoutes';
import { usersApi } from '../../../api/userRoutes';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { typography } from '../../../shared/styles/typography';

const { width, height } = Dimensions.get('window');
const buttonWidth = (width - 48) / 3; // 48 = padding (16 * 2) + gaps (8 * 2)

const ContactScreen = () => {
	const { user, organization } = useData();
	const { colors } = useTheme();
	const [activeTab, setActiveTab] = useState('church');
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [expandedTeams, setExpandedTeams] = useState(new Set());
	const [teamSearchQuery, setTeamSearchQuery] = useState('');
	const [teamsData, setTeamsData] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [users, setUsers] = useState([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);
	const [teamUsers, setTeamUsers] = useState({});

	useEffect(() => {
		const fetchTeams = async () => {
			if (organization?.id) {
				setIsLoading(true);
				try {
					const response = await teamsApi.getAll(organization.id);
					setTeamsData(response.teams);
					console.log('teamsData', teamsData);
					console.log('response.teams', response.teams);
				} catch (error) {
					console.error('Error fetching teams:', error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		fetchTeams();
	}, [organization?.id]);

	useEffect(() => {
		const fetchUsers = async () => {
			if (organization?.id) {
				setIsLoadingUsers(true);
				try {
					const response = await usersApi.getAll(organization.id);
					setUsers(response.users);
				} catch (error) {
					console.error('Error fetching users:', error);
				} finally {
					setIsLoadingUsers(false);
				}
			}
		};

		fetchUsers();
	}, [organization?.id]);

	useEffect(() => {
		if (!users) return;

		const filtered = users
			.filter((u) => u.visibilityStatus !== 'hidden')
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
	}, [searchQuery, users]);

	const userData = {
		firstName: user.firstName ? user.firstName : '',
		lastName: user.lastName ? user.lastName : '',
		email: user.email ? user.email : '',
		phone: user.phoneNumber ? user.phoneNumber : '',
	};

	const handlePhonePress = (phoneNumber) => {
		// Clean the phone number to only include digits
		const cleanNumber = phoneNumber.replace(/\D/g, '');

		// Format for tel: URI scheme
		const telUrl = `tel:${cleanNumber}`;

		// Check if linking can open the URL first
		Linking.canOpenURL(telUrl)
			.then((supported) => {
				if (!supported) {
					Alert.alert(
						'Error',
						'Phone calls are not supported on this device'
					);
					return;
				}
				return Linking.openURL(telUrl);
			})
			.catch((err) => {
				console.error('Error opening phone app:', err);
				Alert.alert('Error', 'Could not open phone app');
			});
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
		if (!teamsData) return [];

		const searchLower = teamSearchQuery.toLowerCase();
		return teamsData.filter(
			(team) =>
				team &&
				((team.name || '').toLowerCase().includes(searchLower) ||
					(team.members || []).some(
						(user) =>
							user &&
							`${user.firstName || ''} ${user.lastName || ''}`
								.toLowerCase()
								.includes(searchLower)
					))
		);
	};

	const getTeamUsers = (teamId) => {
		console.log('teamUsers', teamUsers);
		return teamUsers[teamId] || [];
	};

	const toggleTeam = async (teamId) => {
		const newExpanded = new Set(expandedTeams);
		if (newExpanded.has(teamId)) {
			newExpanded.delete(teamId);
		} else {
			newExpanded.add(teamId);
			// Fetch team users when expanding
			if (!teamUsers[teamId]) {
				try {
					// Try to get team from teamsData first (it might have members already)
					const team = teamsData.find(t => t.id === teamId);
					if (team && team.members && Array.isArray(team.members)) {
						// Team already has members from the initial fetch
						setTeamUsers((prev) => ({
							...prev,
							[teamId]: team.members,
						}));
					} else {
						// Fallback: try to fetch from API
						const response = await teamsApi.getTeamUsers(
							organization.id,
							teamId
						);

						setTeamUsers((prev) => ({
							...prev,
							[teamId]: response.users || response.data?.users || [],
						}));
					}
				} catch (error) {
					console.error('Error fetching team users:', error);
					// Set empty array so UI doesn't break
					setTeamUsers((prev) => ({
						...prev,
						[teamId]: [],
					}));
				}
			}
		}
		setExpandedTeams(newExpanded);
	};

	const renderTeamMember = (user) => {
		console.log('user', user);
		return (
			<TouchableOpacity
				key={user.id}
				style={styles.teamMemberCard}
				onPress={() => {
					// Try to find the full user data from the users list
					// This ensures we have visibilityStatus and other complete user properties
					const fullUser = users.find(u => u.id === user.id);
					// Merge team-specific data (like TeamUsers) with full user data
					setSelectedUser(fullUser ? { ...fullUser, ...user } : user);
					setModalVisible(true);
				}}>
				<Image
					source={
						user.userPhoto
							? { uri: user.userPhoto }
							: require('../../../assets/Assemblie_DefaultUserIcon.png')
					}
					style={styles.userPhoto}
				/>
				<View style={styles.teamMemberInfo}>
					<Text style={styles.userName}>
						{`${user.firstName} ${user.lastName}`}
						{user.isTeamLead && ' (Team Lead)'}
					</Text>
					{user.visibilityStatus === 'public' && user.phoneNumber && (
						<Text style={styles.userPhone}>
							{formatPhoneNumber(user.phoneNumber)}
						</Text>
					)}
				</View>
				{user.TeamUsers?.isActive && (
					<Icon
						name='star'
						size={24}
						color='gold'
						style={styles.activeIcon}
					/>
				)}
			</TouchableOpacity>
		);
	};

	const renderChurchInfo = () => {
		return (
			<View
				style={{
					marginTop: '25%',
					borderColor: lightenColor(organization.primaryColor),
					backgroundColor: lightenColor(
						organization.primaryColor,
						0.2
					),
					padding: 20,
					borderRadius: 10,
					width: '100%',
					alignItems: 'center',
					alignSelf: 'center',
				}}>
				<View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
					<Image
						source={{ uri: organization.orgPicture }}
						style={styles.userIcon}
					/>
					<View
						style={{
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Text style={styles.headerText}>
							{`${organization.name}`}
						</Text>
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
								{formatPhoneNumber(organization.phoneNumber)}
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

	const formatPhoneNumber = (phoneNumber) => {
		if (!phoneNumber) return '';

		// Remove all non-numeric characters
		const cleaned = phoneNumber.replace(/\D/g, '');

		// Take only the last 10 digits if longer
		const tenDigits = cleaned.slice(-10);

		// Check if we have exactly 10 digits
		if (tenDigits.length === 10) {
			return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(
				3,
				6
			)}-${tenDigits.slice(6)}`;
		}

		// If not 10 digits, return the original format
		return phoneNumber;
	};

	const renderUserCard = (user) => (
		<TouchableOpacity
			key={user.id}
			style={styles.userCard}
			onPress={() => {
				setSelectedUser(user);
				setModalVisible(true);
			}}>
			<Image
				source={
					user.userPhoto
						? { uri: user.userPhoto }
						: require('../../../assets/Assemblie_DefaultUserIcon.png')
				}
				style={styles.userPhoto}
			/>
			<View style={styles.userInfo}>
				<Text style={styles.userName}>
					{`${user.firstName} ${user.lastName}`}
				</Text>
				{user.visibilityStatus === 'public' && user.phoneNumber && (
					<Text style={styles.userPhone}>
						{formatPhoneNumber(user.phoneNumber)}
					</Text>
				)}
			</View>
		</TouchableOpacity>
	);


	const renderDirectory = () => {
		if (isLoadingUsers) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator
						size='large'
						color='white'
					/>
				</View>
			);
		}

		if (!users || users.length === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No users found</Text>
				</View>
			);
		}

		return (
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
	};

	const renderTeams = () => {
		if (isLoading) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator
						size='large'
						color='white'
					/>
				</View>
			);
		}

		if (!teamsData || teamsData.length === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No teams found</Text>
				</View>
			);
		}

		return (
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
									<Text style={styles.teamName}>
										{team.name || 'Unnamed Team'}
									</Text>
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
									{team.description || ''}
								</Text>
							</TouchableOpacity>
							{expandedTeams.has(team.id) && (
								<View style={styles.teamMembers}>
									{getTeamUsers(team.id).length > 0 ? (
										getTeamUsers(team.id).map(
											(user) => user && renderTeamMember(user)
										)
									) : (
										<Text style={[styles.emptyText, { padding: 12 }]}>
											No members found
										</Text>
									)}
								</View>
							)}
						</View>
					))}
				</ScrollView>
			</View>
		);
	};

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.container}>
				<View style={styles.filterContainer}>
					<Button
						type={activeTab === 'church' ? 'primary' : 'hollow'}
						icon={
							<Icon
								name='church'
								size={24}
								color={
									activeTab === 'church'
										? 'white'
										: colors.buttons.hollow.text
								}
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() => setActiveTab('church')}
						style={styles.filterButton}
					/>
					<Button
						type={activeTab === 'directory' ? 'primary' : 'hollow'}
						icon={
							<Icon
								name='people'
								size={24}
								color={
									activeTab === 'directory'
										? 'white'
										: colors.buttons.hollow.text
								}
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() => setActiveTab('directory')}
						style={styles.filterButton}
					/>
					<Button
						type={activeTab === 'teams' ? 'primary' : 'hollow'}
						icon={
							<Icon
								name='groups'
								size={24}
								color={
									activeTab === 'teams'
										? 'white'
										: colors.buttons.hollow.text
								}
							/>
						}
						primaryColor={organization.primaryColor}
						onPress={() => setActiveTab('teams')}
						style={styles.filterButton}
					/>
				</View>

				{activeTab === 'church' && renderChurchInfo()}
				{activeTab === 'directory' && renderDirectory()}
				{activeTab === 'teams' && renderTeams()}
				<UserDetailDrawer
					visible={modalVisible}
					onRequestClose={() => {
						setModalVisible(false);
						setSelectedUser(null);
					}}
					user={selectedUser}
					formatPhoneNumber={formatPhoneNumber}
				/>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
		gap: 8,
	},
	filterButton: {
		flex: 1,
		minWidth: buttonWidth,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	teamMemberCard: {
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
	teamMemberInfo: {
		flex: 1,
		marginLeft: 12,
	},
	userName: {
		...typography.h3,
		color: 'white',
	},
	userPhone: {
		...typography.body,
		color: 'white',
		opacity: 0.8,
	},
	activeIcon: {
		marginLeft: 8,
	},
	userIcon: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginRight: 20,
	},
	headerText: {
		...typography.h2,
		color: 'white',
		marginBottom: 10,
	},
	contentText: {
		...typography.body,
		color: 'white',
		marginLeft: 10,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
	},
	directoryContainer: {
		flex: 1,
		width: '100%',
	},
	searchBar: {
		...typography.body,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		color: 'white',
		padding: 10,
		borderRadius: 8,
		marginBottom: 16,
	},
	userList: {
		flex: 1,
	},
	userCard: {
		flexDirection: 'row',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		alignItems: 'center',
	},
	userInfo: {
		flex: 1,
		marginLeft: 12,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '80%',
		borderRadius: 16,
		padding: 20,
	},
	modalCard: {
		alignItems: 'center',
	},
	modalUserPhoto: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 16,
	},
	modalUserName: {
		...typography.h2,
		color: 'white',
		marginBottom: 8,
	},
	modalPhoneContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	modalPhoneText: {
		...typography.body,
		color: 'white',
		marginLeft: 8,
	},
	teamsContainer: {
		flex: 1,
		width: '100%',
	},
	teamsList: {
		flex: 1,
	},
	teamSection: {
		marginBottom: 16,
	},
	teamHeader: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 12,
	},
	teamHeaderContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	teamName: {
		...typography.h3,
		color: 'white',
	},
	teamDescription: {
		...typography.body,
		color: 'white',
		opacity: 0.8,
		marginTop: 4,
	},
	teamMembers: {
		marginTop: 8,
		marginLeft: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		...typography.body,
		color: 'white',
		textAlign: 'center',
	},
});

export default ContactScreen;
