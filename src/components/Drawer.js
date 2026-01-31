import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Animated,
	ScrollView,
	Image,
	Modal,
	Pressable,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../shared/styles/typography';
import { usersApi } from '../../api/userRoutes';
import { announcementsApi, eventsApi } from '../../api/announcementRoutes';
import { familyMembersApi } from '../../api/familyMemberRoutes';
import { ministryApi } from '../../api/ministryRoutes';
import { teamsApi } from '../../api/userRoutes';
import {
	registerForPushNotificationsAsync,
	sendPushTokenToBackend,
} from '../utils/notificationUtils';

const Drawer = ({ visible, onClose }) => {
	const navigation = useNavigation();
	const { colors, updateTheme, toggleColorMode, colorMode } = useTheme();
	const {
		user,
		organization,
		setOrganization,
		setAuth,
		clearUserAndToken,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setSelectedMinistry,
		setTeams,
		teams,
	} = useData();

	const [organizations, setOrganizations] = useState([]);
	const [showOrgDropdown, setShowOrgDropdown] = useState(false);
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));

	// Get current route from navigation state
	const navigationState = navigation.getState();
	const currentRoute =
		navigationState?.routes[navigationState?.index]?.name || 'Home';

	useEffect(() => {
		if (visible) {
			// Only fetch organizations if user exists and has an id
			if (user && user.id) {
				fetchOrganizations();
			}
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible, user]);

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
				const orgs = response.organizations || [];
				setOrganizations(orgs);
			} catch (error) {
				// Silently handle 401 errors (user might be signing out)
				if (error.response?.status === 401) {
					setOrganizations([]);
					return;
				}
				console.error('Error fetching organizations:', error);
				setOrganizations([]);
			}
		}
	};

	const loadOrganizationData = async (organizationId) => {
		try {
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

			const filteredTeams =
				teamsData?.teams?.filter(
					(team) => team.organizationId === organizationId,
				) || [];

			setAnnouncements(announcementsData);
			setEvents(eventsData);
			setFamilyMembers(
				familyMembersData || {
					activeConnections: [],
					pendingConnections: [],
				},
			);
			setMinistries(ministriesData || []);
			setTeams(filteredTeams);

			if (ministriesData?.length > 0) {
				setSelectedMinistry(ministriesData[0]);
			}

			return true;
		} catch (error) {
			console.error('Failed to fetch organization data:', error);
			return false;
		}
	};

	const handleOrganizationSelect = async (selectedOrg) => {
		try {
			setOrganization(selectedOrg);
			updateTheme(selectedOrg);
			setShowOrgDropdown(false);

			const success = await loadOrganizationData(selectedOrg.id);
			if (success) {
				// Register for push notifications
				try {
					const pushToken = await registerForPushNotificationsAsync();
					if (pushToken && user?.id) {
						await sendPushTokenToBackend(
							pushToken,
							user.id,
							selectedOrg.id,
						);
					}
				} catch (notificationError) {
					console.error(
						'Push notification setup failed:',
						notificationError,
					);
				}

				// Navigate to home
				navigation.navigate('Home');
				onClose();
			}
		} catch (error) {
			console.error('Error in handleOrganizationSelect:', error);
		}
	};

	const handleSignOut = async () => {
		try {
			// Close drawer first to prevent any further API calls
			onClose();

			// Clear organization data
			setOrganization(null);
			setAnnouncements([]);
			setEvents([]);
			setFamilyMembers({
				activeConnections: [],
				pendingConnections: [],
			});
			setMinistries([]);
			setTeams([]);
			setOrganizations([]);

			// Clear user and auth state - this will trigger navigation back to AuthStack
			await clearUserAndToken();
			updateTheme(null);
		} catch (error) {
			console.error('Sign out error:', error);
			// Even if there's an error, try to clear auth state
			await clearUserAndToken();
		}
	};

	const menuItems = [
		{ icon: 'home', label: 'Home', screen: 'Home' },
		{
			icon: 'qrcode-scan',
			label: 'Check In',
			screen: 'CheckIn',
			guest: true,
		},
		{ icon: 'hands-pray', label: 'Give', screen: 'Give' },
		{ icon: 'calendar-month', label: 'Events', screen: 'Events' },
		{ icon: 'image', label: 'Media', screen: 'Media' },
		{ icon: 'account-group', label: 'Directory', screen: 'Contact' },
		{
			icon: 'account-group',
			label: 'My Teams',
			screen: 'Teams',
			conditional: true, // Show only if teams exist
		},
		{
			icon: 'calendar-clock',
			label: 'My Schedules',
			screen: 'MySchedules',
			conditional: true, // Show only if teams exist
			guest: true,
		},
		{ icon: 'account', label: 'Profile', screen: 'Profile', guest: true },
		{ icon: 'cog', label: 'Settings', screen: 'Settings', guest: true },
	];

	const filteredMenuItems = menuItems.filter((item) => {
		// Filter out guest-only items if user is guest
		if (item.guest && user?.isGuest) {
			return false;
		}
		// Filter out conditional items (like Teams, Schedules) if condition not met
		if (item.conditional) {
			// Teams, MySchedules, SwapRequests, and UnavailableDates should only show if teams exist and have length > 0
			if (
				item.screen === 'Teams' ||
				item.screen === 'MySchedules' ||
				item.screen === 'SwapRequests' ||
				item.screen === 'UnavailableDates'
			) {
				return teams && teams.length > 0;
			}
		}
		return true;
	});

	const translateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [300, 0],
	});

	return (
		<Modal
			visible={visible}
			transparent
			animationType='none'
			onRequestClose={onClose}>
			<View style={styles.container}>
				<Animated.View
					style={[
						styles.backdrop,
						{
							opacity: backdropOpacity,
						},
					]}>
					<Pressable
						style={styles.backdropPressable}
						onPress={onClose}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.drawer,
						{
							transform: [{ translateX }],
							backgroundColor: colors.background || '#1A1A1A',
						},
					]}>
					<View style={styles.drawerHeader}>
						{!user?.isGuest && (
							<View style={styles.userInfo}>
								<Image
									source={
										user?.userPhoto
											? { uri: user.userPhoto }
											: require('../../assets/Assemblie_DefaultUserIcon.png')
									}
									style={styles.userIcon}
								/>
								<View style={styles.userTextContainer}>
									<Text
										style={[
											styles.userName,
											{ color: colors.text },
										]}>
										{user?.firstName} {user?.lastName}
									</Text>
									{organization && (
										<Text
											style={[
												styles.orgName,
												{ color: colors.textSecondary },
											]}>
											{organization.name}
										</Text>
									)}
								</View>
							</View>
						)}
						<View style={styles.headerButtons}>
							<TouchableOpacity
								onPress={toggleColorMode}
								style={styles.themeButton}>
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
							<TouchableOpacity
								onPress={onClose}
								style={styles.closeButton}>
								<Icon
									name='close'
									size={28}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>
					</View>

					<ScrollView
						style={styles.menuList}
						showsVerticalScrollIndicator={false}>
						{/* Organization Switcher */}
						{organizations.length > 0 && !user?.isGuest && (
							<View style={styles.orgSection}>
								<TouchableOpacity
									style={styles.orgDropdownButton}
									onPress={() =>
										setShowOrgDropdown(!showOrgDropdown)
									}>
									<View style={styles.orgDropdownHeader}>
										<Icon
											name='office-building'
											size={24}
											color={colors.text}
										/>
										<Text
											style={[
												styles.orgDropdownText,
												{ color: colors.text },
											]}>
											Switch Organization
										</Text>
										<Icon
											name={
												showOrgDropdown
													? 'chevron-up'
													: 'chevron-down'
											}
											size={24}
											color={colors.text}
										/>
									</View>
								</TouchableOpacity>
								{showOrgDropdown && (
									<View style={styles.orgDropdownList}>
										{organizations.map((org) => (
											<TouchableOpacity
												key={org.id}
												style={[
													styles.orgItem,
													organization?.id ===
														org.id &&
														styles.orgItemActive,
												]}
												onPress={() =>
													handleOrganizationSelect(
														org,
													)
												}>
												<Image
													source={
														org.orgPicture
															? {
																	uri: org.orgPicture,
																}
															: require('../../assets/Assemblie_DefaultChurchIcon.png')
													}
													style={styles.orgIcon}
												/>
												<Text
													style={[
														styles.orgItemText,
														{ color: colors.text },
													]}>
													{org.name}
												</Text>
												{organization?.id ===
													org.id && (
													<Icon
														name='check'
														size={20}
														color={colors.primary}
													/>
												)}
											</TouchableOpacity>
										))}
									</View>
								)}
							</View>
						)}

						{/* Menu Items */}
						{filteredMenuItems.map((item, index) => {
							const isActive = currentRoute === item.screen;
							return (
								<TouchableOpacity
									key={index}
									style={[
										styles.menuItem,
										isActive && {
											backgroundColor:
												colors.primary + '20',
										},
									]}
									onPress={() => {
										navigation.navigate(
											item.screen,
											item.params || {},
										);
										onClose();
									}}>
									<Icon
										name={item.icon}
										size={24}
										color={
											isActive
												? colors.primary
												: colors.text
										}
										style={styles.menuIcon}
									/>
									<Text
										style={[
											styles.menuText,
											{
												color: isActive
													? colors.primary
													: colors.text,
											},
										]}>
										{item.label}
									</Text>
									<Icon
										name='chevron-right'
										size={20}
										color={colors.textSecondary}
										style={styles.chevron}
									/>
								</TouchableOpacity>
							);
						})}

						{/* Sign Out */}
						<TouchableOpacity
							style={[styles.menuItem, styles.signOutItem]}
							onPress={handleSignOut}>
							<Icon
								name='logout'
								size={24}
								color='#FF3B30'
								style={styles.menuIcon}
							/>
							<Text
								style={[styles.menuText, { color: '#FF3B30' }]}>
								Sign Out
							</Text>
						</TouchableOpacity>
					</ScrollView>
				</Animated.View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	backdropPressable: {
		flex: 1,
	},
	drawer: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: '80%',
		maxWidth: 320,
		shadowColor: '#000',
		shadowOffset: {
			width: -2,
			height: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	drawerHeader: {
		paddingTop: 50,
		paddingHorizontal: 20,
		paddingBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	headerButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	themeButton: {
		padding: 4,
	},
	userInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	userIcon: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	userTextContainer: {
		flex: 1,
	},
	userName: {
		...typography.h3,
		marginBottom: 4,
	},
	orgName: {
		...typography.body,
	},
	closeButton: {
		padding: 4,
	},
	menuList: {
		flex: 1,
	},
	orgSection: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		paddingBottom: 10,
	},
	orgDropdownButton: {
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	orgDropdownHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	orgDropdownText: {
		...typography.bodyMedium,
		marginLeft: 12,
		flex: 1,
	},
	orgDropdownList: {
		paddingHorizontal: 20,
		paddingBottom: 10,
	},
	orgItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 8,
		marginBottom: 4,
	},
	orgItemActive: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	orgIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 12,
	},
	orgItemText: {
		...typography.body,
		flex: 1,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.05)',
	},
	menuIcon: {
		marginRight: 16,
	},
	menuText: {
		...typography.bodyMedium,
		flex: 1,
	},
	chevron: {
		opacity: 0.5,
	},
	signOutItem: {
		marginTop: 20,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 0,
	},
});

export default Drawer;
