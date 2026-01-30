import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	Alert,
	TouchableOpacity,
	Image,
	StyleSheet,
	Dimensions,
	ScrollView,
	Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context';
import Button from '../../shared/buttons/Button';
import { announcementsApi, eventsApi } from '../../api/announcementRoutes';
import { familyMembersApi } from '../../api/familyMemberRoutes';
import { ministryApi } from '../../api/ministryRoutes';
import Background from '../../shared/components/Background';
import { usersApi } from '../../api/userRoutes';
import { LinearGradient } from 'expo-linear-gradient';
import InputWithIcon from '../../shared/components/ImputWithIcon';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { teamsApi } from '../../api/userRoutes';
import { typography } from '../../shared/styles/typography';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../utils/notificationUtils';

const dimensions = Dimensions.get('window');
const screenHeight = dimensions.height;

const OrganizationSwitcher = () => {
	const navigation = useNavigation();
	const [organizationPin, setOrganizationPin] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [organizations, setOrganizations] = useState([]);
	const { colors, updateTheme, toggleColorMode, colorMode } = useTheme();
	const {
		auth,
		user,
		setOrganization,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setSelectedMinistry,
		organization,
		setTeams,
		pendingOrg,
		setPendingOrg,
	} = useData();

	useEffect(() => {
		const handlePendingOrg = async () => {
			// Only run if we are authenticated and have a pending ID from a QR code
			if (auth && user?.id && pendingOrg.id && pendingOrg.orgPin) {
				console.log("Processing pending QR code join for ID:", pendingOrg.id);
				
				try {
					setIsLoading(true);
					// 1. Call your link API (Assuming you update usersApi to accept an ID or handle PIN)
					// If your QR code uses the PIN:
					const response = await usersApi.linkOrganization(pendingOrg.orgPin); 
					
					// 2. Refresh lists
					await fetchOrganizations();
					
					// 3. Auto-select and navigate
					if (response.organization) {
						await handleOrganizationSelect(response.organization);
					}
					
					// 4. Clear the pendings so it doesn't loop
					setPendingOrg({id: null, orgPin: null});
				} catch (error) {
					console.error("Auto-join failed:", error);
					setPendingOrg({id: null, orgPin: null}); // Clear anyway to allow manual use
				} finally {
					setIsLoading(false);
				}
			}
		};
	
		handlePendingOrg();
	}, [auth, user, pendingOrg]);

	useEffect(() => {
		// Only fetch organizations if auth is true and user exists and has an id
		if (auth && user && user.id) {
			fetchOrganizations();
		} else {
			// If not authenticated or no valid user, clear organizations
			setOrganizations([]);
		}
	}, [auth, user]);

	useEffect(() => {
		if (organization) {
			updateTheme(organization);
		}
	}, [organization]);

	const fetchOrganizations = async () => {
		// Check if user exists and has an id (not just an empty object)
		if (!user || !user.id) {
			setOrganizations([]);
			return;
		}
		
		if (user.isGuest) {
			setOrganizations([user.organization]);
		} else {
			try {
				const response = await usersApi.getMemberships();
				const organizations = response.organizations || [];
				setOrganizations(organizations);

				if (organizations.length === 0) {
					console.warn('No organizations found for user');
				}
			} catch (error) {
				// Silently handle 401 errors (user might be signing out)
				if (error.response?.status === 401) {
					setOrganizations([]);
					return;
				}
				console.error('Error fetching organizations:', error);
				Alert.alert('Error', 'Failed to load organizations');
				setOrganizations([]);
			}
		}
	};

	const loadOrganizationData = async (organizationId) => {
		try {
			setIsLoading(true);

			const [
				announcementsData,
				eventsData,
				familyMembersData,
				ministriesData,
				teamsData,
			] = await Promise.all([
				announcementsApi.getAll(organizationId),
				eventsApi.getAll(organizationId),
				familyMembersApi.getAll(),
				ministryApi.getAllForOrganization(organizationId),
				teamsApi.getMyTeams(),
			]);

			// Filter teams to only include those matching the current organization
			const filteredTeams =
				teamsData?.teams?.filter(
					(team) => team.organizationId === organizationId
				) || [];

			setAnnouncements(announcementsData);
			setEvents(eventsData);
			setFamilyMembers(
				familyMembersData || {
					activeConnections: [],
					pendingConnections: [],
				}
			);
			setMinistries(ministriesData || []);
			setTeams(filteredTeams);

			if (ministriesData?.length > 0) {
				setSelectedMinistry(ministriesData[0]);
			}

			setIsLoading(false);
			return true;
		} catch (error) {
			console.error('Failed to fetch organization data:', error);
			setIsLoading(false);
			Alert.alert('Error', 'Failed to load organization data');
			return false;
		}
	};

	const handleOrganizationSelect = async (selectedOrg) => {
		try {
			setOrganization(selectedOrg);
			updateTheme(selectedOrg);

			const success = await loadOrganizationData(selectedOrg.id);
			if (success) {
				// Register for push notifications after organization is selected
				try {
					const pushToken = await registerForPushNotificationsAsync();
					if (pushToken && user?.id) {
						await sendPushTokenToBackend(
							pushToken,
							user.id,
							selectedOrg.id
						);
					}
				} catch (notificationError) {
					console.error(
						'Push notification setup failed:',
						notificationError
					);
				}

				navigation.navigate('MainApp');
			}
		} catch (error) {
			console.error('Error in handleOrganizationSelect:', error);
			Alert.alert('Error', 'Failed to select organization');
		}
	};

	const handleJoinOrganization = async () => {
		setIsLoading(true);
		try {
			const response = await usersApi.linkOrganization(organizationPin);
			await fetchOrganizations(); // Refresh the organizations list

			// Find the newly joined organization from the response
			const newOrg = response.organization;
			if (newOrg) {
				await handleOrganizationSelect(newOrg);
			}
		} catch (error) {
			console.error('Join organization error:', error);
			Alert.alert(
				'Error',
				error.response?.data?.message || 'Failed to join organization'
			);
		} finally {
			setIsLoading(false);
			setOrganizationPin('');
		}
	};

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: false,
		});
	}, [navigation]);

	const renderOrganization = ({ item }) => {
		return (
			<TouchableOpacity onPress={() => handleOrganizationSelect(item)}>
				<LinearGradient
					colors={[
						item.primaryColor || '#6366f1',
						item.secondaryColor || '#818cf8',
					]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={styles.orgButton}>
					<Image
						source={
							item.orgPicture
								? { uri: item.orgPicture }
								: require('../../assets/Assemblie_DefaultChurchIcon.png')
						}
						style={styles.orgImage}
					/>
					<Text style={styles.orgName}>{item.name}</Text>
				</LinearGradient>
			</TouchableOpacity>
		);
	};

	// Don't render if not authenticated - should navigate to AuthMain
	if (!auth || !user || !user.id) {
		return null;
	}

	return (
		<Background>
			<View style={styles.themeToggleContainer}>
				<TouchableOpacity
					onPress={toggleColorMode}
					style={styles.themeToggleButton}>
					<Icon
						name={
							colorMode === 'light'
								? 'moon-waxing-crescent'
								: 'white-balance-sunny'
						}
						size={24}
						color={colors.text}
					/>
				</TouchableOpacity>
			</View>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>

				<View style={styles.container}>
					<Text style={[styles.title, { color: colors.text }]}>
						Select Organization
					</Text>
					<FlatList
						data={organizations}
						keyExtractor={(item) => item.id.toString()}
						renderItem={renderOrganization}
						ItemSeparatorComponent={() => (
							<View style={styles.separator} />
						)}
						scrollEnabled={false}
					/>

					<View style={styles.joinSection}>
						<Text style={[styles.subtitle, { color: colors.text }]}>
							Join Organization
						</Text>
						<InputWithIcon
							inputType='pin'
							value={organizationPin}
							onChangeText={setOrganizationPin}
							primaryColor={colors.primary}
						/>
						<Button
							type='primary'
							text='Join'
							loading={isLoading}
							onPress={handleJoinOrganization}
						/>
					</View>
				</View>
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 30,
	},
	graphicContainer: {
		width: '100%',
		height: screenHeight * 0.4,
		position: 'relative',
	},
	graphicImage: {
		width: '100%',
		height: '100%',
	},
	graphicOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 30,
	},
	graphicHeader: {
		...typography.h1,
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 10,
		fontSize: 28,
	},
	graphicSubtext: {
		...typography.body,
		color: '#FFFFFF',
		textAlign: 'center',
		fontSize: 14,
		opacity: 0.9,
	},
	container: {
		flex: 1,
		paddingHorizontal: 30,
		paddingTop: 30,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 15,
		textAlign: 'center',
	},
	themeToggleContainer: {
		position: 'absolute',
		top: 20,
		right: 20,
		zIndex: 10,
	},
	themeToggleButton: {
		padding: 8,
	},
	orgButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 15,
		borderRadius: 10,
		marginVertical: 5,
	},
	orgImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10,
	},
	orgName: {
		color: '#FFFFFF',
		fontSize: 18,
		fontWeight: '500',
	},
	separator: {
		height: 10,
	},
	joinSection: {
		marginTop: 20,
		marginBottom: 30,
	},
});

export default OrganizationSwitcher;
