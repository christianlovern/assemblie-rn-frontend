import { StyleSheet, Dimensions } from 'react-native';

import tinycolor from 'tinycolor2';
import { lightenColor } from '../helper/colorFixer';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;
const screenHeight = dimensions.height;

// Define different theme color palettes

const commonStyles = StyleSheet.create({
	// Card Styles
	cardBase: {
		marginBottom: 10,
		borderRadius: 10,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	cardImage: {
		borderRadius: 10,
		overflow: 'hidden',
		minHeight: 280,
	},
	carouselCard: {
		height: 280,
	},
	cardOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 10,
	},
	cardContent: {
		flex: 1,
		padding: 15,
		justifyContent: 'space-between',
	},

	// Header Styles
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	iconRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	// Text Styles
	labelText: {
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '500',
	},
	titleText: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 16,
		lineHeight: 20,
		marginVertical: 15,
		flex: 0,
	},

	// Footer Styles
	footerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 'auto',
		paddingTop: 10,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		marginRight: 10,
	},
	locationText: {
		marginLeft: 5,
		fontSize: 14,
		fontWeight: '500',
	},

	// Button Styles
	detailsButton: {
		width: '33%',
		paddingVertical: 8,
		borderRadius: 5,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 'auto',
	},
	buttonFullWidth: {
		marginLeft: 'auto',
		width: '33%',
	},

	// Background Styles
	backgroundGradient: {
		flex: 1,
	},
	backgroundContent: {
		flex: 1,
	},

	// Carousel Styles
	carouselContainer: {
		flex: 1,
		position: 'relative',
	},
	carouselPagerView: {
		height: '100%',
		width: screenWidth,
	},
	carouselCardContainer: {
		flex: 1,
		paddingHorizontal: 20,
		paddingVertical: 10,
		justifyContent: 'center',
	},
	paginationContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		bottom: 20,
		left: 0,
		right: 0,
	},
	paginationDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginHorizontal: 4,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},

	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		maxHeight: '85%',
		borderRadius: 15,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		width: '85%',
		overflow: 'hidden',
	},
	modalContentContainer: {
		padding: 15,
	},
	modalCoverImage: {
		width: '100%',
		height: 250,
	},
	modalDateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
		flexWrap: 'wrap',
	},
	modalButtonContainer: {
		width: '85%',
		paddingVertical: 20,
		alignSelf: 'center',
		marginTop: 20,
	},
	modalCloseButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		padding: 5,
		zIndex: 1,
		backgroundColor: 'white',
		borderRadius: 15,
	},
	calendarModalContent: {
		width: '80%',
		maxHeight: '70%',
		borderRadius: 15,
		padding: 20,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	calendarItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.2)',
	},
	rsvpPhotosContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	rsvpUserPhoto: {
		width: 30,
		height: 30,
		borderRadius: 15,
		borderWidth: 2,
		borderColor: 'white',
	},
	remainingCountContainer: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: 'rgba(255,255,255,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: -10,
	},

	// Input Styles
	inputContainer: {
		marginBottom: 20,
	},
	inputInnerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 15,
		paddingHorizontal: 10,
		height: 60,
	},
	iconWrapper: {
		width: 30,
		justifyContent: 'center',
		alignItems: 'center',
	},
	eyeIconWrapper: {
		width: 50,
		height: 60,
		justifyContent: 'center',
		alignItems: 'center',
	},
	input: {
		flex: 1,
		color: 'white',
		marginLeft: 10,
	},

	// Event Modal Styles
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalScrollContent: {
		padding: 20,
	},
	modalImage: {
		width: '100%',
		height: 200,
		resizeMode: 'cover',
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
	},
	modalDateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	modalLocationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
	},
	modalButtonContainer: {
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	modalCloseButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 1,
		backgroundColor: 'white',
		borderRadius: 15,
		padding: 5,
	},

	// HomeScreen Styles
	homeContainer: {
		flex: 1,
		height: '100%',
		width: '100%',
		marginBottom: 20,
	},
	headerContainer: {
		height: screenHeight / 3,
		width: screenWidth,
		justifyContent: 'flex-end',
		paddingHorizontal: 15,
		paddingBottom: 10,
	},
	rowContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	organizationIcon: {
		width: 100,
		height: 100,
		resizeMode: 'cover',
		marginRight: 10,
		borderRadius: 50,
	},
	buttonContainer: {
		width: '85%',
		justifyContent: 'center',
		alignSelf: 'center',
		marginTop: 20,
	},
	carouselContainer: {
		height: 350,
		marginTop: 20,
	},

	// FileViewScreen Styles
	fileViewContainer: {
		flex: 1,
		paddingTop: 60, // Account for transparent header
	},
	videoContainer: {
		flex: 1,
		backgroundColor: '#000',
	},
	videoWebView: {
		flex: 1,
		backgroundColor: '#000',
	},
	pdfContainer: {
		flex: 1,
		position: 'relative',
	},
	webview: {
		flex: 1,
	},
	downloadButton: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 15,
		borderRadius: 25,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	downloadText: {
		color: 'white',
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
	},
	audioContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		borderWidth: 2,
		borderRadius: 15,
		margin: 20,
	},
	audioText: {
		fontSize: 18,
		fontWeight: '600',
		marginVertical: 15,
		textAlign: 'center',
	},
	image: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingIndicator: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	openPdfButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 15,
		borderRadius: 25,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	openPdfText: {
		color: 'white',
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
	},

	// MediaScreen Styles
	mediaContainer: {
		flex: 1,
	},
	searchContainer: {
		padding: 16,
	},
	searchInput: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 10,
		padding: 12,
		color: 'white',
		fontSize: 16,
	},
	section: {
		padding: 16,
		marginTop: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		color: 'white',
		marginTop: 16,
	},
	folderGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	fileGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	folderCard: {
		width: '48%',
		aspectRatio: 1,
		borderRadius: 10,
		marginBottom: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	folderCover: {
		width: '80%',
		height: '80%',
		borderRadius: 8,
	},
	folderName: {
		marginTop: 8,
		textAlign: 'center',
		fontWeight: '500',
		color: 'white',
	},
	fileCard: {
		width: '48%',
		aspectRatio: 1,
		borderRadius: 10,
		marginBottom: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	thumbnailContainer: {
		width: '80%',
		height: '80%',
		position: 'relative',
	},
	filePreview: {
		width: '100%',
		height: '100%',
		borderRadius: 8,
	},
	fileName: {
		marginTop: 8,
		textAlign: 'center',
		fontWeight: '500',
		color: 'white',
	},
	playIconOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.3)',
		borderRadius: 8,
	},
	loaderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loader: {
		width: 100,
		height: 100,
	},

	// CheckInScreen Styles
	checkInContainer: {
		flex: 1,
		padding: 16,
		backgroundColor: 'transparent',
	},
	checkInHeader: {
		fontSize: 24,
		fontWeight: 'bold',
		marginVertical: 16,
		color: 'white',
		textAlign: 'center',
	},
	subheader: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
		color: 'white',
	},
	pickerContainer: {
		borderRadius: 10,
		marginBottom: 16,
		overflow: 'hidden',
	},
	picker: {
		height: 50,
		color: 'white',
	},
	pickerItem: {
		fontSize: 16,
	},
	inactiveWarning: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 16,
		fontStyle: 'italic',
	},
	gridContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	memberCard: {
		width: '48%',
		padding: 15,
		borderRadius: 10,
		marginBottom: 15,
		borderWidth: 2,
		alignItems: 'center',
	},
	selectedCard: {
		borderWidth: 2,
	},
	checkmarkContainer: {
		position: 'absolute',
		top: 5,
		right: 5,
		zIndex: 1,
	},
	photoContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		overflow: 'hidden',
		marginBottom: 10,
	},
	photo: {
		width: '100%',
		height: '100%',
	},
	memberName: {
		fontSize: 14,
		fontWeight: '500',
		color: 'white',
		textAlign: 'center',
	},
	checkedInText: {
		fontSize: 12,
		color: 'white',
		marginTop: 5,
		opacity: 0.8,
	},

	// ContactScreen Styles
	contactScreen: {
		container: {
			flex: 1,
			marginTop: '10%',
			alignItems: 'center',
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
		// Church Info styles
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
			resizeMode: 'cover',
			marginRight: 10,
			borderRadius: 100,
		},
		infoRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 20,
		},

		// Teams styles
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
			alignItems: 'center',
		},
		teamMemberInfo: {
			marginLeft: 12,
			justifyContent: 'center',
		},
		activeIcon: {
			marginLeft: 'auto',
			paddingLeft: 8,
		},

		// Modal styles
		modalOverlay: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			justifyContent: 'center',
			alignItems: 'center',
		},
		modalContent: {
			width: Dimensions.get('window').width * 0.85,
			minHeight: Dimensions.get('window').height * 0.5,
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
			width: Dimensions.get('window').width * 0.4,
			height: Dimensions.get('window').width * 0.4,
			borderRadius: (Dimensions.get('window').width * 0.4) / 2,
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
	},

	eventsScreen: {
		container: {
			flex: 1,
			padding: 16,
			marginTop: '8%',
		},
		header: {
			fontSize: 24,
			fontWeight: 'bold',
			marginBottom: 16,
			textAlign: 'center',
		},
		filterContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: 16,
			gap: 8,
		},
		filterButton: {
			minWidth: '25%',
			minHeight: 45,
			paddingHorizontal: 15,
		},
		contentContainer: {
			flex: 1,
		},
		calendar: {
			borderRadius: 10,
			elevation: 4,
			marginBottom: 16,
			padding: 10,
		},
		text: {
			fontSize: 16,
		},
		emptyStateContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: 20,
			paddingVertical: 40,
		},
		emptyStateText: {
			fontSize: 16,
			textAlign: 'center',
			color: 'white',
		},
	},

	menuScreen: {
		container: {
			flex: 1,
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
			alignItems: 'center',
			marginTop: '10%',
		},
		headerContainer: {
			height: screenHeight / 3,
			width: screenWidth,
			justifyContent: 'flex-end',
			paddingHorizontal: 15,
			paddingBottom: 10,
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
			fontWeight: 'bold',
			justifyContent: 'center',
			alignSelf: 'center',
			marginLeft: '2%',
		},
		userIcon: {
			width: 75,
			height: 75,
			resizeMode: 'cover',
			marginRight: 10,
			borderRadius: 50,
		},
		organizationName: {
			fontSize: 24,
			fontWeight: 'bold',
			color: '#FFFFFF',
			marginBottom: 10,
		},
		organizationLocation: {
			fontSize: 16,
			fontWeight: 'bold',
			color: '#FFFFFF',
			marginBottom: 10,
		},
		carouselContainer: {
			height: 350,
			marginTop: 20,
		},
		buttonContainer: {
			width: '85%',
			justifyContent: 'center',
			alignSelf: 'center',
			marginTop: 20,
		},
		signOutButton: {
			padding: 8,
		},
		userHeader: {
			marginLeft: '10%',
			marginTop: '15%',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			marginRight: '10%',
		},
		userInfoContainer: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		userTextContainer: {
			justifyContent: 'center',
		},
		bottomButtonContainer: {
			flexDirection: 'row',
			width: '90%',
			justifyContent: 'space-between',
			alignSelf: 'center',
			marginHorizontal: 10,
		},
		buttonWrapper: {
			flex: 1,
			marginHorizontal: 5,
		},
	},

	profileScreen: {
		scrollContainer: {
			paddingVertical: 20,
			alignItems: 'center',
		},
		avatarContainer: {
			marginTop: '15%',
			justifyContent: 'center',
			alignItems: 'center',
			position: 'relative',
		},
		editIcon: {
			position: 'absolute',
			bottom: 0,
			right: 0,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			borderRadius: 12,
			padding: 4,
		},
		inputContainer: {
			marginTop: 20,
			width: '85%',
			zIndex: 1000,
			elevation: 1000,
		},
		label: {
			color: 'white',
			fontSize: 16,
			marginBottom: 8,
		},
		familyContainer: {
			width: '85%',
			marginTop: 20,
			zIndex: 1,
			elevation: 1,
		},
		memberCard: {
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
		userInfo: {
			flex: 1,
			marginLeft: 12,
			justifyContent: 'center',
		},
		userName: {
			color: 'white',
			fontSize: 16,
			fontWeight: 'bold',
			marginBottom: 2,
		},
		userPhone: {
			color: 'white',
			fontSize: 14,
		},
		moreIcon: {
			marginLeft: 8,
		},
		userIcon: {
			width: 150,
			height: 150,
			resizeMode: 'cover',
			marginRight: 10,
			borderRadius: 75,
		},
		subHeaderText: {
			fontSize: 18,
			color: 'white',
			justifyContent: 'center',
			alignSelf: 'center',
			marginTop: '2%',
		},
		headerText: {
			fontSize: 22,
			color: 'white',
			fontWeight: 'bold',
			justifyContent: 'center',
			alignSelf: 'center',
			marginLeft: '2%',
			marginBottom: 40,
		},
		button: {
			width: '85%',
		},
		visibilityDropdown: {
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			borderRadius: 8,
			padding: 16,
			position: 'relative',
			zIndex: 1000,
			elevation: 1000,
		},
		visibilitySelected: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
		visibilityLabel: {
			color: 'white',
			fontSize: 16,
			fontWeight: 'bold',
		},
		visibilityDescription: {
			color: 'rgba(255, 255, 255, 0.8)',
			fontSize: 14,
			marginTop: 8,
		},
		dropdownMenu: {
			position: 'absolute',
			top: '100%',
			left: 0,
			right: 0,
			backgroundColor: 'white',
			borderRadius: 8,
			marginTop: 4,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2,
			},
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 1000,
			zIndex: 1000,
		},
		dropdownItem: {
			padding: 16,
			borderBottomWidth: 1,
			borderBottomColor: '#eee',
		},
		dropdownText: {
			color: '#333',
			fontSize: 14,
		},
		deleteItem: {
			borderBottomWidth: 0,
		},
		deleteText: {
			color: '#ff4444',
		},
		editNameContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
		},
		editNameInput: {
			flex: 1,
			color: 'white',
			fontSize: 16,
			borderBottomWidth: 1,
			borderBottomColor: 'white',
			marginRight: 8,
			padding: 2,
		},
		saveButton: {
			padding: 4,
			borderRadius: 12,
			backgroundColor: 'rgba(255, 255, 255, 0.2)',
		},
		dropdownItemSelected: {
			backgroundColor: 'rgba(0, 0, 0, 0.1)',
		},
		dropdownItemText: {
			fontSize: 16,
			color: '#333',
		},
	},

	settingsScreen: {
		container: {
			flex: 1,
			padding: 16,
			marginTop: '25%',
		},
		section: {
			marginBottom: 16,
			borderRadius: 8,
			overflow: 'hidden',
			borderWidth: 1,
		},
		sectionHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: 16,
		},
		sectionTitle: {
			fontSize: 18,
			fontWeight: 'bold',
		},
		sectionContent: {
			padding: 16,
		},
		settingRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: 8,
			padding: 12,
			borderRadius: 6,
		},
		settingButton: {
			padding: 12,
			marginVertical: 4,
			borderRadius: 6,
		},
		dangerButton: {
			backgroundColor: '#ffebee',
		},
		dangerText: {
			color: '#d32f2f',
		},
	},

	squares: {
		container: {
			width: 150,
			height: 150,
			borderRadius: 20,
			borderWidth: 2,
			margin: 10,
			justifyContent: 'center',
			alignItems: 'center',
		},
		iconContainer: {
			marginBottom: 10,
		},
		title: {
			color: 'white',
			fontSize: 18,
			fontWeight: 'bold',
			textAlign: 'center',
		},
	},

	organizationSwitcher: {
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
	},
});

// Create styles with theme support
export const createThemedStyles = (colors) => {
	return {
		...commonStyles,
		// Theme-specific styles using the colors passed from ThemeContext
		cardLabel: {
			marginLeft: 8,
			fontSize: 14,
			fontWeight: '500',
			color: colors.textWhite,
		},
		cardDate: {
			marginLeft: 8,
			fontSize: 14,
			fontWeight: '500',
			color: colors.textWhite,
		},
		cardTitle: {
			fontSize: 18,
			fontWeight: 'bold',
			marginBottom: 8,
			color: colors.textWhite,
		},
		cardDescription: {
			fontSize: 16,
			lineHeight: 20,
			marginBottom: 'auto',
			flex: 1,
			color: 'rgba(255, 255, 255, 0.9)',
		},
		cardLocation: {
			marginLeft: 5,
			fontSize: 14,
			color: colors.textWhite,
		},
		cardButton: {
			...commonStyles.detailsButton,
			backgroundColor: 'rgba(255, 255, 255, 0.2)',
		},
		cardButtonText: {
			color: colors.textWhite,
			fontSize: 14,
			fontWeight: '500',
			textAlign: 'center',
		},
		button: {
			borderRadius: 30,
			paddingVertical: 10,
			paddingHorizontal: 25,
			backgroundColor: colors.primary,
		},
		loginButtonSection: {
			alignItems: 'center',
			paddingHorizontal: 10,
			marginBottom: -10,
		},
		colorPallet: {
			...colors,
			lightPrimary: lightenColor(colors.primary),
			lightSecondary: lightenColor(colors.secondary),
		},
		topSafeArea: {
			flex: 1,
			backgroundColor: colors.bottomAppBar,
		},
		centeredModalView: {
			flex: 1,
			justifyContent: 'center',
		},
		modalView: {
			marginTop: 30,
			marginBottom: 30,
			marginRight: 35,
			marginLeft: 35,
			backgroundColor: colors.cardBackground,
			borderRadius: 20,
			padding: 15,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2,
			},
			shadowOpacity: 0.25,
			shadowRadius: 4,
			elevation: 5,
			paddingTop: 10,
		},
		modalParagraph: {
			color: 'black',
			fontSize: 16,
			textAlign: 'center',
			padding: 10,
		},
		modalTitle: {
			color: 'black',
			fontSize: 20,
			fontWeight: '600',
			textAlign: 'center',
			padding: 10,
		},

		// Carousel Theme Styles
		emptyText: {
			color: '#fff',
			fontSize: 16,
		},
		arrowIconContainer: {
			position: 'absolute',
			top: '40%',
			right: 0,
			transform: [{ translateY: -15 }],
			padding: 10,
			borderRadius: 50,
			backgroundColor: colors.primary,
		},

		// Modal Theme Styles
		modalDateText: {
			marginLeft: 8,
			fontSize: 16,
			color: 'white',
			flexShrink: 1,
		},
		modalTitle: {
			fontSize: 24,
			fontWeight: 'bold',
			color: 'white',
			marginBottom: 10,
			flexWrap: 'wrap',
			width: '100%',
		},
		modalDescription: {
			fontSize: 16,
			color: 'white',
			marginBottom: 20,
			lineHeight: 24,
			flexWrap: 'wrap',
		},
		modalLocationText: {
			color: 'white',
			marginLeft: 10,
			fontSize: 16,
		},
		viewMoreButton: {
			alignItems: 'center',
			padding: 10,
			marginTop: 10,
		},
		viewMoreText: {
			fontSize: 16,
			textDecorationLine: 'underline',
			color: 'white',
		},
		calendarModalTitle: {
			fontSize: 20,
			fontWeight: 'bold',
			marginBottom: 15,
			color: 'white',
			textAlign: 'center',
		},
		calendarName: {
			fontSize: 16,
			color: 'white',
			fontWeight: '500',
		},
		calendarSource: {
			fontSize: 12,
			color: 'rgba(255,255,255,0.7)',
			marginTop: 4,
		},
		remainingCountText: {
			color: 'white',
			fontSize: 12,
			fontWeight: 'bold',
		},

		// Event Modal Theme Styles
		modalTitle: {
			fontSize: 24,
			fontWeight: 'bold',
			color: colors.textWhite,
			marginBottom: 10,
		},
		modalDescription: {
			fontSize: 16,
			color: colors.textWhite,
			lineHeight: 24,
			marginBottom: 15,
		},
		modalDate: {
			fontSize: 16,
			color: colors.textWhite,
			marginLeft: 10,
		},
		modalLocation: {
			fontSize: 16,
			color: colors.textWhite,
			marginLeft: 10,
			flex: 1,
		},
		modalDivider: {
			height: 1,
			backgroundColor: colors.divider,
			marginVertical: 15,
		},

		// HomeScreen Theme Styles
		organizationName: {
			fontSize: 24,
			fontWeight: 'bold',
			color: colors.textWhite,
			marginBottom: 10,
		},
		organizationLocation: {
			fontSize: 16,
			fontWeight: 'bold',
			color: colors.textWhite,
			marginBottom: 10,
		},
		headerText: {
			fontSize: 28,
			fontWeight: 'bold',
			justifyContent: 'center',
			marginLeft: '7.5%',
			marginBottom: 20,
			color: colors.textWhite,
		},
	};
};

// Export only the common styles that don't depend on theme
export default commonStyles;
