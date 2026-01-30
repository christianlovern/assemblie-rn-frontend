import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../styles/typography';

const StatusBadge = ({ status, style }) => {
	const getStatusConfig = (status) => {
		switch (status) {
			case 'pending':
				return {
					backgroundColor: '#fa8c16',
					color: '#FFFFFF',
					label: 'Pending',
				};
			case 'approved':
				return {
					backgroundColor: '#52c41a',
					color: '#FFFFFF',
					label: 'Approved',
				};
			case 'declined':
				return {
					backgroundColor: '#ff4d4f',
					color: '#FFFFFF',
					label: 'Declined',
				};
			case 'cancelled':
				return {
					backgroundColor: '#d9d9d9',
					color: '#000000',
					label: 'Cancelled',
				};
			case 'swap_requested':
				return {
					backgroundColor: '#1890ff',
					color: '#FFFFFF',
					label: 'Swap Requested',
				};
			default:
				return {
					backgroundColor: '#d9d9d9',
					color: '#000000',
					label: status || 'Unknown',
				};
		}
	};

	const config = getStatusConfig(status);

	return (
		<View
			style={[
				styles.badge,
				{ backgroundColor: config.backgroundColor },
				style,
			]}>
			<Text style={[styles.badgeText, { color: config.color }]}>
				{config.label}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		alignSelf: 'flex-start',
	},
	badgeText: {
		...typography.caption,
		fontSize: 11,
		fontWeight: '600',
	},
});

export default StatusBadge;
