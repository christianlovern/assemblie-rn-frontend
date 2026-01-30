/**
 * This is for a button at the top right-hand corner of the header which, when clicked,
 * will display a modal that allows users to exit the application.
 *
 */

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Octicons as Icon } from '@expo/vector-icons';
import globalStyles from '../styles/globalStyles.js';
import GlobalModal from '../modals/GlobalModal.js';
import { globalText } from '../text/global.js';
import { useData } from '../../context.js';

const SignOutButton = () => {
	const [modalVisible, setModalVisible] = useState(false);
	const {
		clearUserAndToken,
		setOrganization,
		setAnnouncements,
		setEvents,
		setFamilyMembers,
		setMinistries,
		setTeams,
		auth,
	} = useData();

	const handleSignOut = async () => {
		try {
			setModalVisible(false);
			
			// 1. Clear the storage/token first
			await clearUserAndToken();
	
			// 2. Clear all context data immediately
			// Removing the 'if(!auth)' check ensures the cleanup always happens
			setOrganization(null);
			setAnnouncements([]);
			setEvents([]);
			setFamilyMembers({ activeConnections: [], pendingConnections: [] });
			setMinistries([]);
			setTeams([]);
			setUser(null); // Ensure user is also set to null
	
		} catch (error) {
			console.error('Sign out error:', error);
		}
	};

	return (
		<View>
			<GlobalModal
				Title={globalText.exitTitle}
				paragraph={globalText.exitParagraph}
				btn1={globalText.exitBtn1}
				btn2={globalText.exitBtn2}
				setModalVisible={setModalVisible}
				modalVisible={modalVisible}
				onConfirm={handleSignOut}
			/>
			{/* Right Side Header Button */}
			<Pressable
				style={({ pressed }) => [pressed ? { opacity: 0.6 } : {}]}
				onPress={() => setModalVisible(true)}>
				<View
					style={{
						flex: 1,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						alignContent: 'center',
						alignSelf: 'center',
					}}>
					<Icon
						name='sign-out'
						size={25}
						marginTop={3.5}
						color={globalStyles.colorPallet.textWhite}
					/>
				</View>
			</Pressable>
		</View>
	);
};

export default SignOutButton;
