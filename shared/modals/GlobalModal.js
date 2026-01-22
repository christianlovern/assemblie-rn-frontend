/**
 * Modal used for getting a profile picture or signing out of teh mobile app
 * The action to fetch for a profile picture still needs to be implemented
 */

import { Text, View, Modal } from 'react-native';
import React from 'react';
import CancelButton from '../buttons/CancelButton';
import AgreeButton from '../buttons/AgreeButton';
import globalStyles from '../styles/globalStyles';

const GlobalModal = ({
	Title,
	paragraph,
	setModalVisible,
	modalVisible,
	btn1,
	btn2,
	onConfirm,
}) => {
	console.log('GlobalModal rendering, onConfirm exists:');
	return (
		<>
			<View style={globalStyles.centeredView}>
				<Modal
					animationType='fade'
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => {
						setModalVisible(!modalVisible);
					}}>
					<View
						style={[
							globalStyles.centeredModalView,
							modalVisible
								? { backgroundColor: 'rgba(0,0,0,0.5)' }
								: '',
						]}>
						<View style={globalStyles.modalView}>
							<Text style={globalStyles.modalTitle}>{Title}</Text>
							<Text style={globalStyles.modalParagraph}>
								{paragraph}
							</Text>
							<CancelButton
								text={btn1}
								setModalVisible={setModalVisible}
								modalVisible={modalVisible}
							/>
							<AgreeButton
								text={btn2}
								handle={() => {
									console.log('AgreeButton pressed');
									if (onConfirm) {
										console.log(
											'Calling onConfirm function'
										);
										onConfirm();
									}
								}}
							/>
						</View>
					</View>
				</Modal>
			</View>
		</>
	);
};

export default GlobalModal;
