module.exports = {
	project: {
		ios: {},
		android: {},
	},
	assets: ['./node_modules/react-native-vector-icons/Fonts/'],
	dependencies: {
		'@aws-amplify/rtn-push-notification': {
			platforms: {
				ios: null, // Disable iOS - we use expo-notifications
				android: null, // Disable Android - native module incompatible with RN 0.81; we use expo-notifications
			},
		},
		'react-native-track-player': {
			platforms: {
				android: null, // Disable Android platform due to compilation errors with RN 0.81.5
			},
		},
		'react-native-video': {
			platforms: {
				android: null, // Disable Android platform due to compilation errors with RN 0.81.5
			},
		},
	},
};
