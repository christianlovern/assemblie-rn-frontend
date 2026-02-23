import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	ImageBackground,
	Dimensions,
	TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useData } from '../../../context';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightenColor } from '../../../shared/helper/colorFixer';
import Background from '../../../shared/components/Background';
import OrgQRCode from '../../../shared/components/OrgQRCode';
import { typography } from '../../../shared/styles/typography';

const { width } = Dimensions.get('window');

const ShareMyChurchScreen = () => {
	const navigation = useNavigation();
	const { organization } = useData();
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	if (!organization) {
		return (
			<Background>
				<View
					style={[styles.centered, { paddingTop: insets.top + 20 }]}>
					<Text style={{ color: colors.text }}>
						No organization selected.
					</Text>
				</View>
			</Background>
		);
	}

	const orgId = organization.id;
	const orgPin = organization.pinNum ?? '';

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					style={styles.backButton}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
					<Icon
						name='arrow-left'
						size={24}
						color={lightenColor(
							organization.primaryColor || colors.primary,
						)}
					/>
				</TouchableOpacity>
				<Text
					style={[
						styles.headerTitle,
						{
							color: lightenColor(
								organization.primaryColor || colors.primary,
							),
						},
					]}
					numberOfLines={1}>
					Share My Church
				</Text>
				<View style={styles.headerRight} />
			</View>
			<ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 24 },
				]}
				showsVerticalScrollIndicator={false}>
				{/* Cover + Avatar (same pattern as Homescreen) */}
				<ImageBackground
					source={
						organization.coverImage
							? { uri: organization.coverImage }
							: require('../../../assets/Assemblie_DefaultCover.png')
					}
					style={styles.cover}
					resizeMode='cover'>
					<View style={styles.coverOverlay}>
						<Image
							source={
								organization.orgPicture
									? { uri: organization.orgPicture }
									: require('../../../assets/Assemblie_DefaultChurchIcon.png')
							}
							style={styles.avatar}
							resizeMode='cover'
						/>
						<Text
							style={styles.orgName}
							numberOfLines={2}>
							{organization.name}
						</Text>
						{orgPin ? (
							<View style={styles.pinRow}>
								<Text style={styles.pinLabel}>Church PIN</Text>
								<Text style={styles.pinValue}>{orgPin}</Text>
							</View>
						) : null}
					</View>
				</ImageBackground>

				<View style={styles.qrSection}>
					<Text style={[styles.qrTitle, { color: colors.text }]}>
						Scan to connect
					</Text>
					<Text
						style={[
							styles.qrSubtitle,
							{ color: colors.textSecondary },
						]}>
						Others can scan this code to join your church on
					</Text>
					<View style={styles.qrWrapper}>
						<OrgQRCode
							orgId={orgId}
							orgPin={orgPin}
							size={Math.min(width - 80, 280)}
							style={styles.qrCode}
						/>
					</View>
					<View style={styles.joinAssemblieRow}>
						<Text
							style={[
								styles.joinAssemblieText,
								{ color: colors.textSecondary },
							]}>
							Join my church on{' '}
						</Text>
						<Image
							source={require('../../../assets/Icon_Primary.png')}
							style={styles.assemblieLogo}
							resizeMode='contain'
						/>
						<Text
							style={[
								styles.assemblieWordmark,
								{ color: colors.text },
							]}>
							Assemblie
						</Text>
					</View>
					{!orgPin ? (
						<Text
							style={[
								styles.noPinText,
								{ color: colors.textSecondary },
							]}>
							Connection PIN is not set for this organization.
						</Text>
					) : null}
				</View>
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 4,
		paddingBottom: 8,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		...typography.h3,
		flex: 1,
		textAlign: 'center',
	},
	headerRight: {
		width: 32,
	},
	scrollContent: {
		paddingHorizontal: 20,
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	cover: {
		width: width - 40,
		height: 160,
		borderRadius: 12,
		overflow: 'hidden',
		marginBottom: 24,
	},
	coverOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		justifyContent: 'flex-end',
		padding: 16,
	},
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 32,
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.8)',
		marginBottom: 8,
	},
	orgName: {
		...typography.h2,
		color: '#FFFFFF',
		fontSize: 22,
		marginBottom: 4,
	},
	pinRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	pinLabel: {
		...typography.bodySmall,
		color: 'rgba(255,255,255,0.9)',
	},
	pinValue: {
		...typography.bodyMedium,
		color: '#FFFFFF',
		fontWeight: '700',
		letterSpacing: 1,
	},
	qrSection: {
		alignItems: 'center',
		paddingVertical: 8,
	},
	qrTitle: {
		...typography.h3,
		marginBottom: 6,
		textAlign: 'center',
	},
	qrSubtitle: {
		...typography.body,
		textAlign: 'center',
		marginBottom: 20,
		paddingHorizontal: 16,
	},
	qrWrapper: {
		padding: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	qrCode: {
		alignSelf: 'center',
	},
	joinAssemblieRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20,
		flexWrap: 'wrap',
	},
	joinAssemblieText: {
		...typography.body,
	},
	assemblieLogo: {
		width: 24,
		height: 24,
		marginHorizontal: 6,
	},
	assemblieWordmark: {
		...typography.h3,
		fontSize: 18,
		fontWeight: 'bold',
	},
	noPinText: {
		...typography.bodySmall,
		marginTop: 16,
		textAlign: 'center',
		fontStyle: 'italic',
	},
});

export default ShareMyChurchScreen;
