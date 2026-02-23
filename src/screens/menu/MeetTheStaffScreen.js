import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	Linking,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import Background from '../../../shared/components/Background';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { staffApi } from '../../../api/staffRoutes';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { typography } from '../../../shared/styles/typography';
import StaffDetailDrawer from '../../../shared/components/StaffDetailDrawer';

const DEFAULT_AVATAR = require('../../../assets/Assemblie_DefaultUserIcon.png');

const MeetTheStaffScreen = () => {
	const { user, organization } = useData();
	const { colors } = useTheme();
	const [staff, setStaff] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStaff, setSelectedStaff] = useState(null);

	useEffect(() => {
		let cancelled = false;
		const fetchStaff = async () => {
			if (!organization?.id) {
				setLoading(false);
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const data = await staffApi.getAll(organization.id);
				const list = Array.isArray(data) ? data : (data?.staff ?? []);
				if (!cancelled) {
					const featured = list.filter(
						(s) => s.featuredStaff === true,
					);
					setStaff(featured);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e?.message || 'Failed to load staff');
					setStaff([]);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchStaff();
		return () => {
			cancelled = true;
		};
	}, [organization?.id]);

	if (!user || !organization) {
		return null;
	}

	if (loading) {
		return (
			<Background>
				<View
					style={[
						styles.centered,
						{ backgroundColor: colors.background },
					]}>
					<ActivityIndicator
						size='large'
						color={colors.primary}
					/>
					<Text
						style={[
							styles.loadingText,
							{ color: colors.textSecondary },
						]}>
						Loading staff...
					</Text>
				</View>
			</Background>
		);
	}

	return (
		<Background>
			<StaffDetailDrawer
				visible={!!selectedStaff}
				onRequestClose={() => setSelectedStaff(null)}
				staffMember={selectedStaff}
			/>
			<ScrollView
				style={[styles.scroll, { backgroundColor: colors.background }]}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<Text style={[styles.title, { color: colors.text }]}>
					Meet the Staff
				</Text>
				{error ? (
					<View style={styles.errorWrap}>
						<Icon
							name='alert-circle-outline'
							size={48}
							color={colors.textSecondary}
						/>
						<Text
							style={[
								styles.errorText,
								{ color: colors.textSecondary },
							]}>
							{error}
						</Text>
					</View>
				) : staff.length === 0 ? (
					<View style={styles.emptyWrap}>
						<Icon
							name='account-group-outline'
							size={48}
							color={colors.textSecondary}
						/>
						<Text
							style={[
								styles.emptyText,
								{ color: colors.textSecondary },
							]}>
							No featured staff at the moment.
						</Text>
					</View>
				) : (
					staff.map((member) => {
						const name =
							member.user.firstName + ' ' + member.user.lastName;
						const email = member.user.email;
						const description = member.description;
						const imageUri = member.user.userPhoto;
						return (
							<TouchableOpacity
								key={member.id || name}
								activeOpacity={0.85}
								onPress={() => setSelectedStaff(member)}
								style={[
									styles.card,
									{
										backgroundColor:
											colors.cardBackground ||
											colors.background,
										borderColor:
											colors.border ||
											colors.textSecondary + '40',
									},
								]}>
								<Image
									source={
										imageUri && imageUri.trim()
											? { uri: imageUri }
											: DEFAULT_AVATAR
									}
									style={styles.avatar}
									resizeMode='cover'
								/>
								<View style={styles.cardBody}>
									<Text
										style={[
											styles.name,
											{ color: colors.text },
										]}
										numberOfLines={2}>
										{name}
									</Text>
									{email ? (
										<TouchableOpacity
											onPress={(e) => {
												e.stopPropagation();
												Linking.openURL(`mailto:${email}`);
											}}
											style={styles.emailRow}
											activeOpacity={0.7}>
											<Icon
												name='email-outline'
												size={18}
												color={colors.primary}
											/>
											<Text
												style={[
													styles.email,
													{ color: colors.primary },
												]}
												numberOfLines={1}>
												{email}
											</Text>
										</TouchableOpacity>
									) : null}
									{description ? (
										<Text
											style={[
												styles.description,
												{ color: colors.textSecondary },
											]}
											numberOfLines={6}>
											{description}
										</Text>
									) : null}
								</View>
							</TouchableOpacity>
						);
					})
				)}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		...typography.body,
		marginTop: 12,
	},
	title: {
		...typography.h2,
		marginBottom: 20,
		textAlign: 'center',
	},
	errorWrap: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	errorText: {
		...typography.body,
		marginTop: 12,
		textAlign: 'center',
	},
	emptyWrap: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyText: {
		...typography.body,
		marginTop: 12,
		textAlign: 'center',
	},
	card: {
		flexDirection: 'row',
		borderRadius: 16,
		borderWidth: 1,
		padding: 16,
		marginBottom: 16,
		alignItems: 'flex-start',
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		marginRight: 16,
	},
	cardBody: {
		flex: 1,
		minWidth: 0,
	},
	name: {
		...typography.h3,
		marginBottom: 4,
	},
	emailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 8,
	},
	email: {
		...typography.body,
		flex: 1,
	},
	description: {
		...typography.body,
		fontSize: 14,
		lineHeight: 20,
	},
});

export default MeetTheStaffScreen;
