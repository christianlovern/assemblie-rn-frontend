/**
 * Notification Handler for Deep Linking
 * Handles navigation when users tap on push notifications
 */

/**
 * Handle notification tap and navigate to appropriate screen
 * @param {Object} notification - Expo notification object
 * @param {Object} navigation - React Navigation navigation object
 */
export function handleNotificationTap(notification, navigation) {
	const data = notification.request?.content?.data || notification.data;
	console.log('Notification tapped:', data);

	// Normalize screen and params (support type-based routing e.g. team_chat)
	let screen = data.screen || data.navigation?.screen;
	let params = data.params || data.navigation?.params || {};
	if (data.type === 'team_chat') {
		screen = 'TeamChat';
		if (!params.teamId && data.teamId != null) {
			params = {
				teamId: data.teamId,
				organizationId: data.organizationId,
				messageId: data.messageId,
				...(data.teamName && { teamName: data.teamName }),
				...params,
			};
		}
	}

	// Validate screen exists
	if (!screen) {
		console.warn('No screen specified in notification, navigating to Home');
		navigateToHome(navigation, params);
		return;
	}

	// Handle different notification types
	switch (screen) {
		case 'MySchedules':
			navigateToMySchedules(navigation, params);
			break;

		case 'Teams':
		case 'TeamDetails':
			navigateToTeams(navigation, params);
			break;

		case 'TeamChat':
			navigateToTeamChat(navigation, params);
			break;

		case 'Home':
		case 'Dashboard':
			navigateToHome(navigation, params);
			break;

		case 'Events':
			navigateToEvents(navigation, params);
			break;

		case 'SwapRequests':
		case 'Swaps':
			navigateToSwapRequests(navigation, params);
			break;

		case 'UnavailableDates':
			navigateToUnavailableDates(navigation, params);
			break;

		default:
			console.warn(`Unknown screen: ${screen}, navigating to Home`);
			navigateToHome(navigation, params);
	}
}

/**
 * Navigate to My Schedules screen
 * Supports highlighting specific schedules and opening tabs
 */
function navigateToMySchedules(navigation, params) {
	const navigationParams = {
		organizationId: params.organizationId,
		// If scheduleRequestId is provided, highlight that schedule
		...(params.scheduleRequestId && {
			highlightScheduleId: params.scheduleRequestId,
		}),
		// If tab is specified, open that tab (for swap requests)
		...(params.tab && { initialTab: params.tab }),
		// Support date filtering
		...(params.selectedDate && { selectedDate: params.selectedDate }),
	};

	// Navigate to MainApp first if needed, then to MySchedules
	try {
		// Try navigating directly first (if already in MainApp stack)
		navigation.navigate('MySchedules', navigationParams);
	} catch (error) {
		// If that fails, navigate to MainApp first
		console.log('Direct navigation failed, navigating via MainApp:', error);
		navigation.navigate('MainApp', {
			screen: 'MySchedules',
			params: navigationParams,
		});
	}
}

/**
 * Navigate to Teams screen
 * Supports teamId parameter to show specific team
 */
function navigateToTeams(navigation, params) {
	const navigationParams = {
		organizationId: params.organizationId,
		...(params.teamId && { teamId: params.teamId }),
	};

	try {
		navigation.navigate('Teams', navigationParams);
	} catch (error) {
		console.log('Direct navigation failed, navigating via MainApp:', error);
		navigation.navigate('MainApp', {
			screen: 'Teams',
			params: navigationParams,
		});
	}
}

/**
 * Navigate to Team Chat screen (new message notification).
 * Params: teamId, organizationId (optional), messageId (optional, scroll/highlight), teamName (optional).
 */
function navigateToTeamChat(navigation, params) {
	const teamId = params.teamId ?? params.team_id;
	if (!teamId) {
		console.warn('TeamChat notification missing teamId, going to Home');
		navigateToHome(navigation, params);
		return;
	}
	const navigationParams = {
		teamId: Number(teamId) || teamId,
		teamName: params.teamName ?? 'Team Chat',
		...(params.organizationId != null && {
			organizationId: params.organizationId,
		}),
		...(params.messageId != null && {
			messageId: params.messageId,
		}),
	};

	try {
		navigation.navigate('TeamChat', navigationParams);
	} catch (error) {
		navigation.navigate('MainApp', {
			screen: 'TeamChat',
			params: navigationParams,
		});
	}
}

/**
 * Navigate to Home/Dashboard screen
 */
function navigateToHome(navigation, params) {
	const navigationParams = {
		...(params.organizationId && { organizationId: params.organizationId }),
	};

	try {
		navigation.navigate('Home', navigationParams);
	} catch (error) {
		// If Home is not directly accessible, navigate to MainApp
		navigation.navigate('MainApp', {
			screen: 'Home',
			params: navigationParams,
		});
	}
}

/**
 * Navigate to Events screen
 * Supports filter parameter for announcements/events
 */
function navigateToEvents(navigation, params) {
	const navigationParams = {
		organizationId: params.organizationId,
		...(params.filter && { filter: params.filter }),
		...(params.selectedItem && { selectedItem: params.selectedItem }),
	};

	try {
		navigation.navigate('Events', navigationParams);
	} catch (error) {
		navigation.navigate('MainApp', {
			screen: 'Events',
			params: navigationParams,
		});
	}
}

/**
 * Navigate to Swap Requests screen
 * Supports date filtering and highlighting specific swap requests
 */
function navigateToSwapRequests(navigation, params) {
	const navigationParams = {
		organizationId: params.organizationId,
		...(params.teamId && { teamId: params.teamId }),
		...(params.selectedDate && { selectedDate: params.selectedDate }),
		...(params.swapRequestId && { highlightSwapId: params.swapRequestId }),
	};

	try {
		navigation.navigate('SwapRequests', navigationParams);
	} catch (error) {
		navigation.navigate('MainApp', {
			screen: 'SwapRequests',
			params: navigationParams,
		});
	}
}

/**
 * Navigate to Unavailable Dates screen
 */
function navigateToUnavailableDates(navigation, params) {
	const navigationParams = {
		organizationId: params.organizationId,
	};

	try {
		navigation.navigate('UnavailableDates', navigationParams);
	} catch (error) {
		navigation.navigate('MainApp', {
			screen: 'UnavailableDates',
			params: navigationParams,
		});
	}
}
