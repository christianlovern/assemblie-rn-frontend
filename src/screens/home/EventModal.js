import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';

const EventModal = (data) => {
	return (
		<View>
			<Text>{data.name}</Text>
			<Text>{data.description}</Text>
		</View>
	);
};

export default EventModal;
