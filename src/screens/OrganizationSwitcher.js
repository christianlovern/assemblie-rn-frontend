import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	Alert,
	TouchableOpacity,
	Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context';
import Button from '../../shared/buttons/Button';
import { announcementsApi, eventsApi } from '../../api/announcementRoutes';
import { familyMembersApi } from '../../api/familyMemberRoutes';
import { ministryApi } from '../../api/ministryRoutes';
import globalStyles from '../../shared/styles/globalStyles';
import Background from '../../shared/components/Background';
import { usersApi } from '../../api/userRoutes';
import { LinearGradient } from 'expo-linear-gradient';
import InputWithIcon from '../../shared/components/ImputWithIcon';

const OrganizationSwitcher = () => {
	const navigation = useNavigation();
	const [organizationPin, setOrganizationPin] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [organizations, setOrganizations] = useState([]);
	const {
		user,
		setOrganization,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setSelectedMinistry,
	} = useData();

	useEffect(() => {
		fetchOrganizations();
	}, []);

	const fetchOrganizations = async () => {
		try {
			const data = await usersApi.getMemberships();
			setOrganizations(data.organizations);
		} catch (error) {
			console.error('Error fetching organizations:', error);
			Alert.alert('Error', 'Failed to load organizations');
		}
	};

	const loadOrganizationData = async (organizationId) => {
		try {
			const [
				announcementsData,
				eventsData,
				familyMembersData,
				ministriesData,
			] = await Promise.all([
				announcementsApi.getAll(organizationId),
				eventsApi.getAll(organizationId),
				familyMembersApi.getAll(),
				ministryApi.getAllForOrganization(organizationId),
			]);

			setAnnouncements({
				announcements: announcementsData.announcements || [],
			});
			setEvents({ events: eventsData.events || [] });
			setFamilyMembers(familyMembersData || []);
			setMinistries(ministriesData || []);
			setSelectedMinistry(ministriesData[0]);
		} catch (error) {
			console.error('Failed to fetch data:', error);
			Alert.alert('Error', 'Failed to load organization data');
		}
	};

	const handleOrganizationSelect = async (organization) => {
		setOrganization(organization);
		await loadOrganizationData(organization.id);
		navigation.navigate('Home');
	};

	const handleJoinOrganization = async () => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/link-organization', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					organizationPin,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to join organization');
			}

			const data = await response.json();
			Alert.alert('Success', 'Successfully joined organization');
			fetchOrganizations(); // Refresh the organizations list
		} catch (error) {
			Alert.alert('Error', 'Failed to join organization');
		} finally {
			setIsLoading(false);
			setOrganizationPin('');
		}
	};

	// Remove the header in the navigation options
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: false,
		});
	}, [navigation]);

	console.log(organizations);

	const renderOrganization = ({ item }) => {
		console.log('Organization colors:', {
			primaryColor: item.primaryColor,
			secondaryColor: item.secondaryColor,
			name: item.name,
		});

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
					<Text style={[styles.orgName, { color: '#fff' }]}>
						{item.name}
					</Text>
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
						primaryColor={globalStyles.colorPallet.primary}
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
		padding: 20,
		paddingTop: 50, // Add some top padding since we removed the header
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: 'white',
	},
	separator: {
		height: 10,
	},
	joinSection: {
		marginTop: 30,
		padding: 20,
		borderTopWidth: 1,
		borderTopColor: 'white',
	},
	subtitle: {
		fontSize: 18,
		marginBottom: 10,
		color: 'white',
	},
	input: {
		backgroundColor: '#fff',
		padding: 10,
		borderRadius: 5,
		marginBottom: 10,
	},
	orgButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	orgImage: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 15,
	},
	orgName: {
		fontSize: 16,
		flex: 1,
		color: '#fff',
	},
});

export default OrganizationSwitcher;
