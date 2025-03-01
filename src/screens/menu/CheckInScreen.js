import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useData } from '../../../context';
import Background from '../../../shared/components/Background';
import Button from '../../../shared/buttons/Button';
import { lightenColor } from '../../../shared/helper/colorFixer';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

const CheckInScreen = () => {
	const [checkedInMemberIds, setCheckedInMemberIds] = useState([]);
	const { user, organization, ministries, familyMembers } = useData();
	const [selectedMinistry, setSelectedMinistry] = useState(
		ministries[0]?.name
	);
	const confettiRef = useRef();
	const [isCheckedIn, setIsCheckedIn] = useState(false);

	const handleCheckIn = () => {
		console.log({
			ministry: selectedMinistry,
			checkedInMembers: checkedInMemberIds,
		});
		if (confettiRef.current) {
			confettiRef.current.start();
		}
		setIsCheckedIn(true);
	};

	const handleMinistryChange = (value) => {
		setSelectedMinistry(value);
		setIsCheckedIn(false);
	};

	const toggleMemberSelection = (memberId) => {
		setIsCheckedIn(false);
		setCheckedInMemberIds((prevIds) =>
			prevIds.includes(memberId)
				? prevIds.filter((id) => id !== memberId)
				: [...prevIds, memberId]
		);
	};

	const selectedMinistryObj = ministries.find(
		(m) => m.name === selectedMinistry
	);
	const isMinistryActive = selectedMinistryObj?.isActive ?? true;

	return (
		<Background
			primaryColor={organization.primaryColor}
			secondaryColor={organization.secondaryColor}>
			<ScrollView style={styles.container}>
				<Text style={styles.header}>Check In</Text>

				<Text style={styles.subheader}>Select Ministry</Text>
				<View style={styles.pickerContainer}>
					<Picker
						selectedValue={selectedMinistry}
						onValueChange={handleMinistryChange}
						style={[styles.picker, { color: '#fff' }]}
						dropdownIconColor='#fff'
						prompt='Select Ministry'
						mode='dropdown'
						dropdownStyle={{
							backgroundColor: organization.primaryColor,
						}}
						itemStyle={{
							backgroundColor: organization.primaryColor,
						}}>
						{ministries.map((ministry, index) => (
							<Picker.Item
								key={index}
								label={ministry.name}
								value={ministry.name}
								color={
									ministry.isActive
										? '#fff'
										: lightenColor('#808080')
								}
								style={{
									backgroundColor: organization.primaryColor,
								}}
							/>
						))}
					</Picker>
				</View>

				{!isMinistryActive && selectedMinistryObj?.inactiveMessage && (
					<Text
						style={[
							styles.inactiveWarning,
							{
								color: lightenColor(
									organization.secondaryColor,
									50
								),
							},
						]}>
						{selectedMinistryObj.inactiveMessage}
					</Text>
				)}

				<Text style={[styles.header, { textAlign: 'left' }]}>
					Who's checking in?
				</Text>
				<View style={styles.gridContainer}>
					{familyMembers.map((member, index) => (
						<TouchableOpacity
							key={index}
							style={[
								styles.memberCard,
								{
									backgroundColor: lightenColor(
										organization.primaryColor
									),
									borderColor: organization.primaryColor,
								},
								checkedInMemberIds.includes(member.id) && [
									styles.selectedCard,
									{
										backgroundColor: lightenColor(
											organization.secondaryColor
										),
										borderColor: organization.primaryColor,
									},
								],
							]}
							onPress={() => toggleMemberSelection(member.id)}>
							{checkedInMemberIds.includes(member.id) && (
								<View style={styles.checkmarkContainer}>
									<Ionicons
										name='checkmark-circle'
										size={24}
										color={organization.primaryColor}
									/>
								</View>
							)}
							<View style={styles.photoContainer}>
								<Image
									source={require('../../../assets/dummy-org-logo.jpg')}
									style={styles.photo}
								/>
							</View>
							<Text style={styles.memberName}>
								{`${member.firstName} ${member.lastName}`}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<Button
					type='primary'
					primaryColor={
						isMinistryActive && checkedInMemberIds.length > 0
							? organization.primaryColor
							: 'gray'
					}
					text={isCheckedIn ? 'Checked In!' : 'Complete Check In'}
					onPress={() => handleCheckIn()}
					disabled={!isMinistryActive || isCheckedIn}
				/>

				{isCheckedIn && (
					<ConfettiCannon
						ref={confettiRef}
						count={200}
						origin={{ x: -10, y: -10 }}
						autoStart={true}
						fadeOut={true}
						fallSpeed={3000}
						explosionSpeed={350}
						colors={[
							organization.primaryColor,
							organization.secondaryColor,
							'#fff',
						]}
						onAnimationEnd={() => setIsCheckedIn(false)}
					/>
				)}
			</ScrollView>
		</Background>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: 'transparent',
	},
	header: {
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
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		marginBottom: 24,
		overflow: 'hidden',
	},

	gridContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginVertical: 16,
	},
	memberCard: {
		width: '48%',
		aspectRatio: 1,
		borderRadius: 8,
		padding: 8,
		marginBottom: 16,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		position: 'relative',
	},
	selectedCard: {
		borderWidth: 2,
	},
	photoContainer: {
		width: '60%',
		aspectRatio: 1,
		borderRadius: 999,
		overflow: 'hidden',
		marginBottom: 8,
	},
	photo: {
		width: '100%',
		height: '100%',
	},
	memberName: {
		textAlign: 'center',
		fontWeight: '500',
	},
	checkInButton: {
		backgroundColor: '#4040ff',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		marginVertical: 24,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	checkmarkContainer: {
		position: 'absolute',
		top: 4,
		right: 4,
		zIndex: 1,
	},
	inactiveWarning: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
		letterSpacing: 1.5,
	},
});

export default CheckInScreen;
