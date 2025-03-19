import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	Alert,
	TouchableOpacity,
	Image,
	StyleSheet,
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

const OrganizationSwitcher = () => {
	const navigation = useNavigation();
	const [organizationPin, setOrganizationPin] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [organizations, setOrganizations] = useState([]);
	const { colors, updateTheme } = useTheme();
	const {
		user,
		setOrganization,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setSelectedMinistry,
		organization,
		setTeams,
	} = useData();

	useEffect(() => {
		if (organization) {
			updateTheme(organization);
		}
	}, [organization]);

	useEffect(() => {
		fetchOrganizations();
	}, []);

	const fetchOrganizations = async () => {
		try {
			const response = await usersApi.getMemberships();

			const organizations = response.organizations || [];
			setOrganizations(organizations);
		} catch (error) {
			console.error('Error fetching organizations:', error);
			Alert.alert('Error', 'Failed to load organizations');
			setOrganizations([]);
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

			setAnnouncements(announcementsData);
			setEvents(eventsData);
			setFamilyMembers(
				familyMembersData || {
					activeConnections: [],
					pendingConnections: [],
				}
			);
			setMinistries(ministriesData || []);
			setTeams(teamsData?.teams || []);
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
				navigation.navigate('BottomTabs', { screen: 'Home' });
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
								: require('../../assets/Assemblie_Icon.png')
						}
						style={styles.orgImage}
					/>
					<Text style={styles.orgName}>{item.name}</Text>
				</LinearGradient>
			</TouchableOpacity>
		);
	};

	return (
		<Background>
			<View style={styles.container}>
				<Text style={styles.title}>Select Organization</Text>
				<FlatList
					data={organizations}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderOrganization}
					ItemSeparatorComponent={() => (
						<View style={styles.separator} />
					)}
				/>

				<View style={styles.joinSection}>
					<Text style={styles.subtitle}>Join Organization</Text>
					<InputWithIcon
						inputType='pin'
						value={organizationPin}
						onChangeText={setOrganizationPin}
						primaryColor={colors.primary}
					/>
					<Button
						type='gradient'
						text='Join'
						loading={isLoading}
						onPress={handleJoinOrganization}
					/>
				</View>
			</View>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 30,
		paddingTop: 30,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 20,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 15,
		textAlign: 'center',
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
