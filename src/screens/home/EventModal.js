import React from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	ScrollView,
	Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { dateNormalizer } from '../../../shared/helper/normalizers';
import Button from '../../../shared/buttons/Button';
import { typography } from '../../../shared/styles/typography';
import { StyleSheet } from 'react-native';

const EventModal = ({ visible, onRequestClose, data }) => {
	return (
		<Modal
			visible={visible}
			transparent={true}
			onRequestClose={onRequestClose}
			animationType='slide'>
			<View style={globalStyles.modalContainer}>
				<View style={globalStyles.modalContent}>
					<TouchableOpacity
						style={globalStyles.modalCloseButton}
						onPress={onRequestClose}>
						<Icon
							name='close'
							size={24}
							color='black'
						/>
					</TouchableOpacity>

					<ScrollView style={globalStyles.modalScrollContent}>
						{data.image && (
							<Image
								source={{ uri: data.image }}
								style={globalStyles.modalImage}
							/>
						)}

						<View style={globalStyles.modalHeader}>
							<Text style={styles.modalTitle}>{data.name}</Text>
						</View>

						<View style={globalStyles.modalDateContainer}>
							<Icon
								name='event'
								size={24}
								color='white'
							/>
							<Text style={styles.modalDate}>
								{data.startDate && data.endDate
									? `${dateNormalizer(
											data.startDate
									  )} - ${dateNormalizer(data.endDate)}`
									: data.startDate
									? dateNormalizer(data.startDate)
									: 'Date TBD'}
							</Text>
						</View>

						{data.location && (
							<View style={globalStyles.modalLocationContainer}>
								<Icon
									name='location-pin'
									size={24}
									color='white'
								/>
								<Text style={styles.modalLocation}>
									{data.location}
								</Text>
							</View>
						)}

						<View style={globalStyles.modalDivider} />

						<Text style={styles.modalDescription}>
							{data.description}
						</Text>

						<View style={globalStyles.modalButtonContainer}>
							<Button
								text='Close'
								onPress={onRequestClose}
							/>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalTitle: {
		color: 'white',
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		...typography.h2,
	},
	modalDate: {
		color: 'white',
		fontSize: 16,
		marginLeft: 10,
		...typography.bodyMedium,
	},
	modalLocation: {
		color: 'white',
		fontSize: 16,
		marginLeft: 10,
		...typography.bodyMedium,
	},
	modalDescription: {
		color: 'white',
		fontSize: 16,
		lineHeight: 24,
		marginTop: 10,
		...typography.body,
	},
});

export default EventModal;
