import React, { useState, useEffect, useRef, useCallback } from 'react';
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
	Keyboard,
	TouchableWithoutFeedback,
	Platform,
} from 'react-native';
import Background from '../../../shared/components/Background';
import KeyboardAwareScrollView from '../../../shared/components/KeyboardAwareScrollView';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../../shared/buttons/Button';
import UserDetailDrawer from '../../../shared/components/UserDetailDrawer';
import {
	MaterialCommunityIcons as CommunityIcon,
	MaterialIcons as Icon,
} from '@expo/vector-icons';
import { teamsApi } from '../../../api/teamRoutes';
import { usersApi } from '../../../api/userRoutes';
import { contactApi } from '../../../api/contactRoutes';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { typography } from '../../../shared/styles/typography';

const { width, height } = Dimensions.get('window');
const buttonWidth = (width - 48) / 3; // 48 = padding (16 * 2) + gaps (8 * 2)

const ContactScreen = () => {
	const { user, organization } = useData();

	if (!user || !organization) {
		return null;
	}
	const { colors, colorMode } = useTheme();
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
	// Contact Us form (church tab)
	const [contactTopics, setContactTopics] = useState([]);
	const [contactTopicsLoading, setContactTopicsLoading] = useState(false);
	const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
	const [contactName, setContactName] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [contactTopicId, setContactTopicId] = useState(null);
	const [contactMessage, setContactMessage] = useState('');
	const [contactSubmitting, setContactSubmitting] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	const churchScrollViewRef = useRef(null);
	const churchContentRef = useRef(null);
	const emailFieldRef = useRef(null);
	const messageFieldRef = useRef(null);

	const scrollToFocusedInput = useCallback((fieldRef) => {
		const scrollView = churchScrollViewRef.current;
		const content = churchContentRef.current;
		if (!scrollView || !content || !fieldRef?.current) return;
		fieldRef.current.measureLayout(
			content,
			(_x, y) => {
				const offset = Platform.OS === 'ios' ? 120 : 80;
				scrollView.scrollTo({
					y: Math.max(0, y - offset),
					animated: true,
				});
			},
			() => {},
		);
	}, []);

	useEffect(() => {
		const showSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e) => setKeyboardHeight(e.endCoordinates?.height ?? 0),
		);
		const hideSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => setKeyboardHeight(0),
		);
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	// Prefill contact form from user when user/org available
	useEffect(() => {
		if (user && organization) {
			const name = [user.firstName, user.lastName]
				.filter(Boolean)
				.join(' ')
				.trim();
			setContactName(name || '');
			setContactEmail(user.email || '');
		}
	}, [
		user?.id,
		user?.firstName,
		user?.lastName,
		user?.email,
		organization?.id,
	]);

	// Fetch contact topics when church tab is active
	useEffect(() => {
		if (activeTab !== 'church' || !organization?.id) return;
		let cancelled = false;
		setContactTopicsLoading(true);
		contactApi
			.getTopics(organization.id)
			.then((data) => {
				if (!cancelled) setContactTopics(data.topics || []);
			})
			.catch((err) => {
				if (!cancelled) {
					setContactTopics([]);
				}
			})
			.finally(() => {
				if (!cancelled) setContactTopicsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [activeTab, organization?.id]);

	useEffect(() => {
		const fetchTeams = async () => {
			if (organization?.id) {
				setIsLoading(true);
				try {
					const response = await teamsApi.getAll(organization.id);
					setTeamsData(response.teams);
					} catch (_) {} finally {
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
					} catch (_) {} finally {
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
					.includes(searchQuery.toLowerCase()),
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
						'Phone calls are not supported on this device',
					);
					return;
				}
				return Linking.openURL(telUrl);
			})
			.catch(() => {
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
					},
				);
				break;
			case 'twitter':
				// Try to open X/Twitter app first, fallback to web
				Linking.openURL(`twitter://user?screen_name=${handle}`).catch(
					() => {
						Linking.openURL(`https://twitter.com/${handle}`);
					},
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
								.includes(searchLower),
					)),
		);
	};

	const getTeamUsers = (teamId) => {
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
					const team = teamsData.find((t) => t.id === teamId);
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
							teamId,
						);

						setTeamUsers((prev) => ({
							...prev,
							[teamId]:
								response.users || response.data?.users || [],
						}));
					}
				} catch (error) {
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
		return (
			<TouchableOpacity
				key={user.id}
				style={styles.teamMemberCard}
				onPress={() => {
					const fullUser = users.find((u) => u.id === user.id);
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
				<View style={[styles.teamMemberInfo, { color: colors.text }]}>
					<Text style={[styles.userName, { color: colors.text }]}>
						{`${user.firstName} ${user.lastName}`}
						{user.isTeamLead && ' (Team Lead)'}
					</Text>
					{user.visibilityStatus === 'public' && user.phoneNumber && (
						<Text
							style={[styles.userPhone, { color: colors.text }]}>
							{formatPhoneNumber(user.phoneNumber)}
						</Text>
					)}
				</View>
				{user.TeamUsers?.isActive && (
					<Icon
						name='star'
						size={24}
						color={colors.primary}
						style={[styles.activeIcon, { color: colors.primary }]}
					/>
				)}
			</TouchableOpacity>
		);
	};

	const formInputBg =
		colorMode === 'dark'
			? 'rgba(255, 255, 255, 0.1)'
			: 'rgba(255, 255, 255, 0.9)';

	const handleContactSubmit = async () => {
		const name = contactName.trim();
		const email = contactEmail.trim();
		const message = contactMessage.trim();
		if (!name || !email) {
			Alert.alert('Error', 'Please enter your name and email.');
			return;
		}
		if (!message) {
			Alert.alert('Error', 'Please enter your message.');
			return;
		}
		setContactSubmitting(true);
		try {
			await contactApi.submit({
				name,
				email,
				message,
				...(contactTopicId != null && organization?.id
					? {
							topicId: contactTopicId,
							organizationId: organization.id,
						}
					: {}),
			});
			Alert.alert(
				'Success',
				'Your message has been sent. We will get back to you soon.',
			);
			setContactMessage('');
		} catch (err) {
			Alert.alert(
				'Error',
				err.message || 'Failed to send message. Please try again.',
			);
		} finally {
			setContactSubmitting(false);
		}
	};

	const selectedTopicLabel =
		contactTopicId != null
			? (contactTopics.find((t) => t.id === contactTopicId)?.label ??
				'Select topic')
			: 'Select topic';

	const renderChurchInfo = () => {
		const primaryColor = organization.primaryColor || colors.primary;
		const borderColor = lightenColor(primaryColor);
		const iconColor = colorMode === 'dark' ? colors.text : primaryColor;
		const textColor = colors.text;
		const secondaryText = colors.textSecondary || colors.text;

		return (
			<View style={styles.churchTabWrap}>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<KeyboardAwareScrollView
						scrollViewRef={churchScrollViewRef}
						style={styles.churchScroll}
						contentContainerStyle={[
							styles.churchScrollContent,
							{ paddingBottom: keyboardHeight + 24 },
						]}
						keyboardShouldPersistTaps='handled'
						keyboardVerticalOffset={60}
						keyboardDismissMode='on-drag'>
						<View
							ref={churchContentRef}
							collapsable={false}>
							{/* Church contact card: transparent bg, primary border */}
							<View
								style={[
									styles.churchCard,
									{
										borderColor,
										borderWidth: 1.5,
									},
								]}>
								<View style={styles.churchCardHeader}>
									<Image
										source={{
											uri: organization.orgPicture,
										}}
										style={styles.userIcon}
									/>
									<View style={styles.churchCardTitleWrap}>
										<Text
											style={[
												styles.headerText,
												{ color: textColor },
											]}>
											{organization.name}
										</Text>
									</View>
								</View>

								<View style={styles.churchCardBody}>
									{organization.phoneNumber && (
										<TouchableOpacity
											style={styles.infoRow}
											onPress={() =>
												handlePhonePress(
													organization.phoneNumber,
												)
											}>
											<Icon
												name='phone'
												size={24}
												color={iconColor}
											/>
											<Text
												style={[
													styles.contentText,
													{ color: textColor },
												]}>
												{formatPhoneNumber(
													organization.phoneNumber,
												)}
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
												color={iconColor}
											/>
											<View>
												<Text
													style={[
														styles.contentText,
														{ color: textColor },
													]}>
													{organization.addressOne}
												</Text>
												{organization.addressTwo && (
													<Text
														style={[
															styles.contentText,
															{
																color: textColor,
															},
														]}>
														{
															organization.addressTwo
														}
													</Text>
												)}
												<Text
													style={[
														styles.contentText,
														{ color: textColor },
													]}>
													{`${organization.city}, ${organization.state} ${organization.zipCode}`}
												</Text>
											</View>
										</TouchableOpacity>
									)}

									{organization.website && (
										<TouchableOpacity
											style={styles.infoRow}
											onPress={() =>
												handleWebsitePress(
													organization.website,
												)
											}>
											<Icon
												name='language'
												size={24}
												color={iconColor}
											/>
											<Text
												style={[
													styles.contentText,
													{ color: textColor },
												]}>
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
													organization.facebook,
												)
											}>
											<CommunityIcon
												name='facebook'
												size={24}
												color={iconColor}
											/>
											<Text
												style={[
													styles.contentText,
													{ color: textColor },
												]}>
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
													organization.instagram,
												)
											}>
											<CommunityIcon
												name='instagram'
												size={24}
												color={iconColor}
											/>
											<Text
												style={[
													styles.contentText,
													{ color: textColor },
												]}>
												{organization.instagram}
											</Text>
										</TouchableOpacity>
									)}

									{organization.x && (
										<TouchableOpacity
											style={styles.infoRow}
											onPress={() =>
												handleSocialPress(
													'twitter',
													organization.x,
												)
											}>
											<CommunityIcon
												name='twitter'
												size={24}
												color={iconColor}
											/>
											<Text
												style={[
													styles.contentText,
													{ color: textColor },
												]}>
												{organization.x}
											</Text>
										</TouchableOpacity>
									)}
								</View>
							</View>

							{/* Contact Us form */}
							<Text
								style={[
									styles.formSectionTitle,
									{ color: textColor },
								]}>
								Contact Us
							</Text>
							<View style={styles.contactForm}>
								<View style={styles.inputGroup}>
									<Text
										style={[
											styles.label,
											{ color: textColor },
										]}>
										Name
									</Text>
									<TextInput
										style={[
											styles.formInput,
											{
												backgroundColor: formInputBg,
												color: textColor,
												borderColor: secondaryText,
											},
										]}
										value={contactName}
										onChangeText={setContactName}
										placeholder='Your name'
										placeholderTextColor={secondaryText}
										editable={!contactSubmitting}
									/>
								</View>
								<View
									ref={emailFieldRef}
									style={styles.inputGroup}
									collapsable={false}>
									<Text
										style={[
											styles.label,
											{ color: textColor },
										]}>
										Email
									</Text>
									<TextInput
										style={[
											styles.formInput,
											{
												backgroundColor: formInputBg,
												color: textColor,
												borderColor: secondaryText,
											},
										]}
										value={contactEmail}
										onChangeText={setContactEmail}
										placeholder='your@email.com'
										placeholderTextColor={secondaryText}
										keyboardType='email-address'
										autoCapitalize='none'
										editable={!contactSubmitting}
										onFocus={() =>
											setTimeout(
												() =>
													scrollToFocusedInput(
														emailFieldRef,
													),
												300,
											)
										}
									/>
								</View>
								<View style={styles.inputGroup}>
									<Text
										style={[
											styles.label,
											{ color: textColor },
										]}>
										Topic
									</Text>
									<TouchableOpacity
										style={[
											styles.formInput,
											styles.topicPicker,
											{
												backgroundColor: formInputBg,
												borderColor: secondaryText,
											},
										]}
										onPress={() =>
											setTopicDropdownOpen(true)
										}
										disabled={
											contactTopicsLoading ||
											contactSubmitting
										}>
										<Text
											style={[
												styles.topicPickerText,
												{
													color:
														contactTopicId != null
															? textColor
															: secondaryText,
												},
											]}
											numberOfLines={1}>
											{contactTopicsLoading
												? 'Loading topics...'
												: selectedTopicLabel}
										</Text>
										<Icon
											name={
												topicDropdownOpen
													? 'expand-less'
													: 'expand-more'
											}
											size={24}
											color={secondaryText}
										/>
									</TouchableOpacity>
								</View>
								<View
									ref={messageFieldRef}
									style={styles.inputGroup}
									collapsable={false}>
									<Text
										style={[
											styles.label,
											{ color: textColor },
										]}>
										Message
									</Text>
									<TextInput
										style={[
											styles.formInput,
											styles.messageInput,
											{
												backgroundColor: formInputBg,
												color: textColor,
												borderColor: secondaryText,
											},
										]}
										value={contactMessage}
										onChangeText={setContactMessage}
										placeholder='Your message...'
										placeholderTextColor={secondaryText}
										multiline
										numberOfLines={4}
										editable={!contactSubmitting}
										onFocus={() =>
											setTimeout(
												() =>
													scrollToFocusedInput(
														messageFieldRef,
													),
												300,
											)
										}
									/>
								</View>
								<TouchableOpacity
									style={[
										styles.submitButton,
										{
											backgroundColor: primaryColor,
										},
										contactSubmitting &&
											styles.submitButtonDisabled,
									]}
									onPress={handleContactSubmit}
									disabled={contactSubmitting}>
									{contactSubmitting ? (
										<ActivityIndicator color='#fff' />
									) : (
										<Text style={styles.submitButtonText}>
											Send Message
										</Text>
									)}
								</TouchableOpacity>
							</View>

							{/* Topic dropdown modal */}
							<Modal
								visible={topicDropdownOpen}
								transparent
								animationType='fade'
								onRequestClose={() =>
									setTopicDropdownOpen(false)
								}>
								<TouchableOpacity
									style={styles.modalOverlay}
									activeOpacity={1}
									onPress={() => setTopicDropdownOpen(false)}>
									<View
										style={[
											styles.topicDropdown,
											{
												backgroundColor:
													colors.cardBackground ||
													formInputBg,
												borderColor: secondaryText,
											},
										]}>
										<TouchableOpacity
											style={[
												styles.topicDropdownItem,
												{
													borderBottomColor:
														secondaryText,
												},
											]}
											onPress={() => {
												setContactTopicId(null);
												setTopicDropdownOpen(false);
											}}>
											<Text
												style={[
													styles.topicDropdownItemText,
													{ color: textColor },
												]}>
												None
											</Text>
										</TouchableOpacity>
										{contactTopics.map((topic) => (
											<TouchableOpacity
												key={topic.id}
												style={[
													styles.topicDropdownItem,
													{
														borderBottomColor:
															secondaryText,
													},
												]}
												onPress={() => {
													setContactTopicId(topic.id);
													setTopicDropdownOpen(false);
												}}>
												<Text
													style={[
														styles.topicDropdownItemText,
														{ color: textColor },
													]}>
													{topic.label}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								</TouchableOpacity>
							</Modal>
						</View>
					</KeyboardAwareScrollView>
				</TouchableWithoutFeedback>
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
				6,
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
			<View style={[styles.userInfo, { color: colors.text }]}>
				<Text style={[styles.userName, { color: colors.text }]}>
					{`${user.firstName} ${user.lastName}`}
				</Text>
				{user.visibilityStatus === 'public' && user.phoneNumber && (
					<Text style={[styles.userPhone, { color: colors.text }]}>
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
					<Text style={[styles.emptyText, { color: colors.text }]}>
						No users found
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.directoryContainer}>
				<TextInput
					style={[
						styles.searchBar,
						{
							color: colors.text,
							borderColor: colors.primary,
							borderWidth: 1.5,
						},
					]}
					placeholder='Search by name...'
					placeholderTextColor={colors.text}
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
					<Text style={[styles.emptyText, { color: colors.text }]}>
						No teams found
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.teamsContainer}>
				<TextInput
					style={[
						styles.searchBar,
						{
							color: colors.text,
							borderColor: colors.primary,
							borderWidth: 1.5,
						},
					]}
					placeholder='Search teams or members...'
					placeholderTextColor={colors.text}
					value={teamSearchQuery}
					onChangeText={setTeamSearchQuery}
				/>
				<ScrollView style={styles.teamsList}>
					{getFilteredTeams().map((team) => (
						<View
							key={team.id}
							style={[
								styles.teamSection,
								{
									borderColor: colors.primary,
									borderWidth: 1.5,
								},
							]}>
							<TouchableOpacity
								style={styles.teamHeader}
								onPress={() => toggleTeam(team.id)}>
								<View style={styles.teamHeaderContent}>
									<Text
										style={[
											styles.teamName,
											{ color: colors.text },
										]}>
										{team.name || 'Unnamed Team'}
									</Text>
									<Icon
										name={
											expandedTeams.has(team.id)
												? 'expand-less'
												: 'expand-more'
										}
										size={24}
										color={colors.primary}
									/>
								</View>
								<Text
									style={[
										styles.teamDescription,
										{ color: colors.text },
									]}>
									{team.description || ''}
								</Text>
							</TouchableOpacity>
							{expandedTeams.has(team.id) && (
								<View style={styles.teamMembers}>
									{getTeamUsers(team.id).length > 0 ? (
										getTeamUsers(team.id).map(
											(user) =>
												user && renderTeamMember(user),
										)
									) : (
										<Text
											style={[
												styles.emptyText,
												{ color: colors.text },
												{ padding: 12 },
											]}>
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
					{teamsData && teamsData.length > 0 && (
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
					)}
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
		// marginBottom: 0,
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
		marginBottom: 10,
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
	// Church tab: card + form
	churchTabWrap: {
		flex: 1,
		width: '100%',
	},
	churchScroll: {
		flex: 1,
		width: '100%',
	},
	churchScrollContent: {
		paddingBottom: 24,
	},
	churchCard: {
		backgroundColor: 'transparent',
		borderRadius: 12,
		padding: 20,
		marginTop: 16,
		alignSelf: 'stretch',
	},
	churchCardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		marginBottom: 16,
	},
	churchCardTitleWrap: {
		flex: 1,
		justifyContent: 'center',
		marginLeft: 12,
	},
	churchCardBody: {
		marginTop: 4,
	},
	formSectionTitle: {
		...typography.h3,
		marginTop: 24,
		marginBottom: 12,
	},
	contactForm: {
		marginTop: 8,
	},
	inputGroup: {
		marginBottom: 16,
	},
	label: {
		...typography.bodyMedium,
		marginBottom: 6,
	},
	formInput: {
		...typography.body,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	messageInput: {
		minHeight: 100,
		textAlignVertical: 'top',
	},
	topicPicker: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	topicPickerText: {
		...typography.body,
		flex: 1,
	},
	submitButton: {
		marginTop: 8,
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	submitButtonDisabled: {
		opacity: 0.7,
	},
	submitButtonText: {
		...typography.bodyMedium,
		color: '#FFFFFF',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	topicDropdown: {
		width: '100%',
		maxWidth: 320,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
	},
	topicDropdownItem: {
		padding: 16,
		borderBottomWidth: 1,
	},
	topicDropdownItemText: {
		...typography.body,
	},
});

export default ContactScreen;
