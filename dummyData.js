const dummyImage = require('./assets/dummy-org-cover.jpg');

export const announcements = [
	{
		id: 1,
		name: 'Annual Church Picnic & Family Fun Day',
		description:
			"Join us for our biggest community event of the year! We'll have games for all ages, a potluck lunch, live music, and activities for the whole family. Bring your favorite dish to share and don't forget your lawn chairs or blankets. There will be face painting for kids, a volleyball tournament for teens and adults, and our famous dessert contest! In case of rain, we have indoor facilities ready.",
		displayStartDate: new Date(2024, 2, 15), // March 15, 2024
		displayEndDate: new Date(2024, 3, 15), // April 15, 2024
		image: dummyImage,
	},
	{
		id: 2,
		name: 'Summer Mission Trip Information Sessions',
		description:
			"Interested in joining our summer mission trip to Guatemala? We're hosting a series of information sessions where you can learn about our partnership with local communities, project details, costs, and travel arrangements. These sessions are mandatory for all potential participants. Parents are encouraged to attend if the participant is under 18.",
		displayStartDate: new Date(2024, 3, 1), // April 1, 2024
		displayEndDate: new Date(2024, 4, 1), // May 1, 2024
	},
	{
		id: 3,
		name: 'Worship Team Auditions',
		description:
			"The worship team is expanding! We're looking for vocalists, guitarists, drummers, and keyboard players who are passionate about leading worship. Experience is preferred but not required - we value teachable spirits and committed hearts. Auditions will include both musical evaluation and a brief interview about your faith journey and ministry goals.",
		displayStartDate: new Date(2024, 4, 1), // May 1, 2024
		displayEndDate: new Date(2024, 5, 1), // June 1, 2024
		image: dummyImage,
	},
	{
		id: 4,
		name: 'Building Fund Campaign Launch',
		description:
			"As our community grows, so do our space needs. We're excited to announce the launch of our Building Fund Campaign! Our goal is to raise $500,000 for a new youth center and expanded fellowship hall. Join us for the campaign kickoff to learn about the vision, see the architectural plans, and find out how you can be part of this exciting new chapter in our church's history.",
		displayStartDate: new Date(2024, 5, 15), // June 15, 2024
		displayEndDate: new Date(2024, 6, 15), // July 15, 2024
	},
];

export const events = [
	{
		id: 1,
		name: 'Easter Sunrise Service & Breakfast',
		description:
			"Welcome the joy of Easter morning with our traditional sunrise service, followed by a full breakfast fellowship. The service begins at 6:30 AM in the garden area, where we'll witness the sunrise together while celebrating the resurrection. After the service, join us in the fellowship hall for a delicious breakfast including eggs, bacon, pancakes, fresh fruit, and more. Special activities will be available for children. Please RSVP to help us plan for food.",
		startDate: new Date(2024, 3, 1), // April 1, 2024
		endDate: new Date(2024, 3, 1), // April 1, 2024
		Ministry: {
			id: 2,
			name: 'Worship',
		},
		Team: null,
		rsvpUsers: [],
		eventLocation: 'Main Sanctuary & Fellowship Hall',
		image: dummyImage,
	},
	{
		id: 2,
		name: 'Youth Summer Camp 2024',
		description:
			"A week of adventure, friendship, and spiritual growth awaits! This year's camp theme is 'Fearless Faith' and will include daily worship, small group discussions, outdoor activities, swimming, hiking, and evening campfires. Professional counselors and our youth ministry team will provide supervision and guidance. All meals and activities are included in the registration fee. Early bird registration discount available until May 1st.",
		startDate: new Date(2024, 6, 15), // July 15, 2024
		endDate: new Date(2024, 6, 21), // July 21, 2024
		Ministry: null,
		Team: {
			id: 2,
			name: 'Youth',
		},
		rsvpUsers: [],
		eventLocation: 'Camp Pine Valley',
	},
	{
		id: 3,
		name: 'Marriage Enrichment Weekend',
		description:
			'Invest in your marriage with this special weekend retreat. Led by certified marriage counselors and experienced couples, this retreat offers workshops on communication, conflict resolution, and rekindling romance. The schedule includes both group sessions and private couple time. Childcare is provided for children ages 2-12. All meals and materials are included in the registration fee. Space is limited to 20 couples to ensure personal attention.',
		startDate: new Date(2024, 4, 17), // May 17, 2024
		endDate: new Date(2024, 4, 19), // May 19, 2024
		Ministry: {
			id: 1,
			name: 'Family',
		},
		Team: {
			id: 1,
			name: 'Family',
		},
		rsvpUsers: [],
		eventLocation: 'Mountain View Retreat Center',
		image: dummyImage,
	},
	{
		id: 4,
		name: 'Christmas Eve Candlelight Service',
		description:
			"Join us for our beloved Christmas Eve tradition. This beautiful service features carols, scripture readings, special music from our choir and orchestra, and the passing of candlelight. The children's choir will perform, and there will be a special message for families. The service concludes with our candlelight ceremony as we sing 'Silent Night.' Nursery care available for children under 3. Arrive early as this service typically fills to capacity.",
		startDate: new Date(2024, 11, 24), // December 24, 2024
		endDate: new Date(2024, 11, 24), // December 24, 2024
		Ministry: {
			id: 2,
			name: 'Worship',
		},
		Team: {
			id: 3,
			name: 'Production',
		},
		rsvpUsers: [],
		eventLocation: 'Main Sanctuary',
		image: dummyImage,
	},
	{
		id: 5,
		name: 'Community Thanksgiving Dinner',
		description:
			"In the spirit of gratitude and community service, we're hosting our annual Community Thanksgiving Dinner. This free event is open to everyone, especially those who might be alone for the holiday or in need of a meal. Traditional Thanksgiving dishes will be served, and transportation can be arranged for those who need it. Volunteers are needed for cooking, serving, and cleanup shifts.",
		startDate: new Date(2024, 10, 28), // November 28, 2024
		endDate: new Date(2024, 10, 28), // November 28, 2024
		Ministry: {
			id: 3,
			name: 'Outreach',
		},
		Team: {
			id: 4,
			name: 'Service',
		},
		rsvpUsers: [],
		eventLocation: 'Fellowship Hall',
	},
];

export const users = [
	{
		id: '1',
		firstName: 'John',
		lastName: 'Smith',
		email: 'john.smith@email.com',
		password: 'hashedPassword1',
		phoneNumber: '(555) 123-4567',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'public',
	},
	{
		id: '2',
		firstName: 'Sarah',
		lastName: 'Johnson',
		email: 'sarah.j@email.com',
		password: 'hashedPassword2',
		phoneNumber: '(555) 234-5678',
		userPhoto: dummyImage,
		accessLevel: 'admin',
		isFirstTime: false,
		visibility: 'private',
	},
	{
		id: '3',
		firstName: 'Michael',
		lastName: 'Davis',
		email: 'm.davis@email.com',
		password: 'hashedPassword3',
		phoneNumber: '(555) 345-6789',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'hidden',
	},
	{
		id: '4',
		firstName: 'Emma',
		lastName: 'Wilson',
		email: 'emma.w@email.com',
		password: 'hashedPassword4',
		phoneNumber: '(555) 456-7890',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: true,
		visibility: 'public',
	},
	{
		id: '5',
		firstName: 'James',
		lastName: 'Brown',
		email: 'j.brown@email.com',
		password: 'hashedPassword5',
		phoneNumber: '(555) 567-8901',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'private',
	},
	{
		id: '6',
		firstName: 'Lisa',
		lastName: 'Anderson',
		email: 'l.anderson@email.com',
		password: 'hashedPassword6',
		phoneNumber: '(555) 678-9012',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'public',
	},
	{
		id: '7',
		firstName: 'David',
		lastName: 'Taylor',
		email: 'd.taylor@email.com',
		password: 'hashedPassword7',
		phoneNumber: '(555) 789-0123',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'private',
	},
	{
		id: '8',
		firstName: 'Rachel',
		lastName: 'Martinez',
		email: 'r.martinez@email.com',
		password: 'hashedPassword8',
		phoneNumber: '(555) 890-1234',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'public',
	},
	{
		id: '9',
		firstName: 'Thomas',
		lastName: 'Garcia',
		email: 't.garcia@email.com',
		password: 'hashedPassword9',
		phoneNumber: '(555) 901-2345',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: true,
		visibility: 'hidden',
	},
	{
		id: '10',
		firstName: 'Jessica',
		lastName: 'Moore',
		email: 'j.moore@email.com',
		password: 'hashedPassword10',
		phoneNumber: '(555) 012-3456',
		userPhoto: dummyImage,
		accessLevel: 'member',
		isFirstTime: false,
		visibility: 'public',
	},
];

export const teams = [
	{
		id: '1',
		name: 'Worship Team',
		description: 'Music and worship coordination team',
		organizationId: '1',
	},
	{
		id: '2',
		name: 'Welcome Team',
		description: 'Greeting and hospitality team',
		organizationId: '1',
	},
	{
		id: '3',
		name: 'Production Team',
		description: 'Audio, visual, and lighting team',
		organizationId: '1',
	},
	{
		id: '4',
		name: 'Kids Ministry',
		description: "Children's education and care team",
		organizationId: '1',
	},
	{
		id: '5',
		name: 'Outreach Team',
		description: 'Community service and missions team',
		organizationId: '1',
	},
];

export const teamUsers = [
	// Worship Team
	{
		id: '1',
		teamId: '1',
		userId: '1', // John Smith
		isTeamLead: true,
		isActive: true,
	},
	{
		id: '2',
		teamId: '1',
		userId: '4', // Emma Wilson
		isTeamLead: false,
		isActive: true,
	},
	// Welcome Team
	{
		id: '3',
		teamId: '2',
		userId: '2', // Sarah Johnson
		isTeamLead: true,
		isActive: true,
	},
	{
		id: '4',
		teamId: '2',
		userId: '6', // Lisa Anderson
		isTeamLead: false,
		isActive: true,
	},
	{
		id: '5',
		teamId: '2',
		userId: '8', // Rachel Martinez
		isTeamLead: false,
		isActive: true,
	},
	// Production Team
	{
		id: '6',
		teamId: '3',
		userId: '5', // James Brown
		isTeamLead: true,
		isActive: true,
	},
	{
		id: '7',
		teamId: '3',
		userId: '7', // David Taylor
		isTeamLead: false,
		isActive: true,
	},
	// Kids Ministry
	{
		id: '8',
		teamId: '4',
		userId: '10', // Jessica Moore
		isTeamLead: true,
		isActive: true,
	},
	{
		id: '9',
		teamId: '4',
		userId: '8', // Rachel Martinez
		isTeamLead: false,
		isActive: true,
	},
	// Outreach Team
	{
		id: '10',
		teamId: '5',
		userId: '6', // Lisa Anderson
		isTeamLead: true,
		isActive: true,
	},
	{
		id: '11',
		teamId: '5',
		userId: '1', // John Smith
		isTeamLead: false,
		isActive: true,
	},
];
