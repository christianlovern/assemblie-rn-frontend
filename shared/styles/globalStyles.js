import { StyleSheet } from 'react-native';

import tinycolor from 'tinycolor2';

const lightenColor = (color, amount = 25) => {
	return tinycolor(color).lighten(amount).toHexString();
};

export const globalStyles = StyleSheet.create({
	button: {
		borderRadius: 30,
		paddingVertical: 10,
		paddingHorizontal: 25,
		backgroundColor: '#4d43ad',
	},
	buttonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'center',
	},
	authInput: {
		marginTop: 5,
		marginBottom: 5,
		borderRadius: 10,
		backgroundColor: '#FFFFFF99',
	},
	authInputPass: {
		marginTop: 5,
		marginBottom: 5,
		borderRadius: 10,
		backgroundColor: '#FFFFFF99',
		flexDirection: 'row',
		alignItems: 'center',
	},
	pinText: {
		color: 'black',
		fontWeight: 'bold',
		fontSize: 20,
		padding: 10,
		// textAlign: "center"
	},
	inputText: {
		color: 'black',
		fontWeight: 'bold',
		fontSize: 20,
		padding: 10,
	},
	inputTextPass: {
		color: 'black',
		fontWeight: 'bold',
		fontSize: 20,
		flex: 1,
		padding: 10,
	},
	icon: {
		marginRight: 20,
	},
	formErrorText: {
		color: 'red',
		fontWeight: 'bold',
		fontSize: 15,
		textAlign: 'left',
		marginLeft: 12,
		marginBottom: 12,
	},
	highlight: {
		fontWeight: '700',
	},
	loginButtonSection: {
		alignItems: 'center',
		paddingHorizontal: 10,
		marginBottom: -10,
	},
	activities: {
		color: 'black',
		fontSize: 16,
		textAlign: 'left',
		paddingTop: 10,
		paddingBottom: 20,
		paddingHorizontal: 10,
	},

	birthday: {
		color: 'black',
		fontSize: 16,
		textAlign: 'left',
		paddingTop: 10,
		paddingHorizontal: 10,
	},
	messageName: {
		color: 'black',
		fontSize: 16,
	},
	messageSubject: {
		color: 'black',
		fontSize: 14,
		opacity: 0.8,
	},
	messageDate: {
		color: 'black',
		fontSize: 12,
		textAlign: 'left',
	},
	paragraph: {
		color: 'black',
		fontSize: 18,
		textAlign: 'left',
		paddingTop: 10,
		paddingBottom: 10,
		paddingLeft: 10,
		paddingRight: 20,
	},
	sectionTitle: {
		color: 'black',
		fontSize: 20,
		fontWeight: '600',
		paddingLeft: 10,
	},
	communityTitle: {
		color: 'black',
		fontSize: 20,
		fontWeight: '600',
	},
	eventTitle: {
		color: 'black',
		fontSize: 20,
		fontWeight: '600',
	},
	MenuTitle: {
		color: 'black',
		fontSize: 20,
		fontWeight: '600',
		paddingLeft: 30,
	},
	communityProfileTitle: {
		color: 'black',
		fontSize: 16,
		fontWeight: '600',
		paddingLeft: 5,
	},
	profileTitle: {
		color: 'black',
		fontSize: 20,
		fontWeight: '600',
		paddingLeft: 5,
	},
	communityName: {
		color: 'black',
		fontSize: 16,
		fontWeight: '200',
		opacity: 0.8,
		paddingBottom: 10,
		paddingLeft: 5,
	},
	staffName: {
		color: 'black',
		fontSize: 16,
		fontWeight: '600',
		paddingLeft: 10,
	},
	messageDates: {
		color: 'black',
		fontSize: 14,
		fontWeight: '400',
		paddingLeft: 10,
	},
	staffTitle: {
		color: 'black',
		fontSize: 14,
		fontWeight: '200',
		paddingLeft: 10,
		opacity: 0.8,
	},
	card: {
		borderRadius: 15,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		marginBottom: 10,
		marginTop: 10,
	},
	verticalCard: {
		marginTop: 0,
		marginLeft: 0,
		marginRight: 0,
		paddingVertical: 0,
	},
	colorPallet: {
		primary: '#332E82',
		lightPrimary: lightenColor('#332E82'),
		secondary: '#791951',
		lightSecondary: lightenColor('#791951'),
		accent: '#9D94E8',
		accentText: '#666563',
		bottomAppBar: '#F8F8F8',
		scaffoldBackground: '#FDFE0E',
		warning: '#AD4343',
		divider: '#CCCCCC',
		cardBackground: '#FFFFFF',
		textWhite: '#FFFFFF',
		lightPurple: '#867fcd',
	},
	topSafeArea: {
		flex: 1,
		backgroundColor: '#FAF9F8',
	},
	profileCircle: {
		width: 80,
		height: 80,
		borderRadius: 50,
		borderColor: '#DFE0E3',
		marginVertical: -20,
	},
	contactCircle: {
		width: 150,
		height: 150,
		borderRadius: 75,
		borderColor: '#DFE0E3',
	},
	circlePlay: {
		width: 35,
		height: 35,
		borderRadius: 50,
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	headerCircle: {
		backgroundColor: '#867fcd',
		borderRadius: 50,
		width: 30,
		height: 30,
	},
	menus: {
		color: 'black',
		fontSize: 16,
		textAlign: 'left',
		padding: 20,
		marginLeft: '15%',
	},
	eventTime: {
		color: 'black',
		fontSize: 18,
		paddingLeft: 30,
		textAlign: 'left',
	},
	eventBirthdayName: {
		color: 'black',
		fontSize: 18,
		paddingLeft: 30,
		textAlign: 'left',
	},
	eventBirthdayDate: {
		color: 'black',
		fontSize: 18,
		paddingRight: 30,
	},
	eventsList: {
		color: 'black',
		fontSize: 18,
		paddingLeft: 10,
		textAlign: 'left',
	},
	// Login styles
	authButton: {
		flexDirection: 'row',
		borderRadius: 15,
		paddingVertical: 10,
		paddingHorizontal: 25,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center', //Centered vertically
		alignItems: 'center', //Centered horizontally
		borderWidth: 1,
		borderColor: '#666563',
	},
	authButtonLogo: {
		height: 50,
		width: 50,
	},
	authButtonText: {
		color: '#666563',
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'center',
		flex: 1,
	},
	altAuthButtonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'center',
		flex: 1,
	},
	signInButton: {
		flexDirection: 'row',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 25,
		backgroundColor: '#FFFFFF99',
		margin: 20,
		marginLeft: 30,
		marginRight: 30,
		width: 125,
		justifyContent: 'center', //Centered vertically
		alignItems: 'center', //Centered horizontally
		alignSelf: 'center',
	},
	passwordResetButton: {
		flexDirection: 'row',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 25,
		backgroundColor: '#FFF',
		margin: 20,
		marginLeft: 30,
		marginRight: 30,
		width: 225,
		justifyContent: 'center', //Centered vertically
		alignItems: 'center', //Centered horizontally
		alignSelf: 'center',
	},

	// global styles
	ButtonRow: {
		flexDirection: 'row',
		paddingHorizontal: 10,
		justifyContent: 'space-around',
	},
	grayText: {
		color: 'gray',
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
		fontSize: 20,
	},

	// modal styles
	centeredModalView: {
		flex: 1,
		justifyContent: 'center',
	},
	modalView: {
		marginTop: 30,
		marginBottom: 30,
		marginRight: 35,
		marginLeft: 35,
		backgroundColor: 'white',
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
	altModalParagraph: {
		color: '#4D43AD',
		fontSize: 16,
		fontWeight: 'bold',
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
	cancelButton: {
		borderRadius: 30,
		paddingVertical: 8,
		paddingHorizontal: 25,
		borderWidth: 3,
		borderColor: '#4d43ad',
	},
	SignOutButton: {
		borderRadius: 30,
		paddingVertical: 8,
		paddingHorizontal: 25,
		borderWidth: 3,
		borderColor: '#AD4343',
		backgroundColor: '#AD4343',
	},
	cancelText: {
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'left',
		color: '#4d43ad',
	},
});
export default globalStyles;
