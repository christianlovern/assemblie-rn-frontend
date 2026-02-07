import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Modal,
	Pressable,
	TouchableOpacity,
	Platform,
	Dimensions,
	ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';
import Button from '../buttons/Button';
import QRCodeDisplay from './QRCodeDisplay';

const PAGE_WIDTH = Dimensions.get('window').width;

const PickupQRDrawer = ({
	visible,
	onRequestClose,
	items: itemsProp,
	initialIndex = 0,
	token: tokenLegacy,
	attendeeName: attendeeNameLegacy,
	primaryColor,
	secondaryColor,
}) => {
	const { colors } = useTheme();
	const [slideAnim] = useState(new Animated.Value(0));
	const [backdropOpacity] = useState(new Animated.Value(0));
	const [pageIndex, setPageIndex] = useState(0);
	const scrollRef = useRef(null);

	const items =
		itemsProp?.length > 0
			? itemsProp
			: tokenLegacy
				? [
						{
							token: tokenLegacy,
							attendeeName: attendeeNameLegacy || 'Pickup',
						},
					]
				: [];
	const currentItem = items[pageIndex];

	const screenHeight = Dimensions.get('window').height;
	const drawerHeight = Math.min(screenHeight * 0.82, 560);
	const translateY = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [drawerHeight, 0],
	});

	const bg = primaryColor || colors.primary;

	useEffect(() => {
		if (visible) {
			// Testing: log QR code URL(s) when drawer opens
			items.forEach((item, i) => {
				const url = item.payload ?? item.token;
				console.log(
					`[PickupQR] QR ${i + 1}/${items.length} (${item.attendeeName}):`,
					url,
				);
			});
			setPageIndex(Math.min(initialIndex, Math.max(0, items.length - 1)));
			slideAnim.setValue(0);
			backdropOpacity.setValue(0);
			requestAnimationFrame(() => {
				Animated.parallel([
					Animated.timing(slideAnim, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(backdropOpacity, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
				]).start();
			});
		} else {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible]);

	useEffect(() => {
		if (visible && scrollRef.current && items.length > 0) {
			const idx = Math.min(initialIndex, items.length - 1);
			scrollRef.current.scrollTo({
				x: idx * PAGE_WIDTH,
				animated: false,
			});
			setPageIndex(idx);
		}
	}, [visible, initialIndex, items.length]);

	const handleScroll = (e) => {
		const x = e.nativeEvent.contentOffset.x;
		const index = Math.round(x / PAGE_WIDTH);
		if (index >= 0 && index < items.length && index !== pageIndex) {
			setPageIndex(index);
		}
	};

	if (!visible) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType='none'
			onRequestClose={onRequestClose}>
			<View
				style={styles.container}
				pointerEvents={visible ? 'auto' : 'none'}>
				<Animated.View
					style={[styles.backdrop, { opacity: backdropOpacity }]}
					pointerEvents={visible ? 'auto' : 'none'}>
					<Pressable
						style={styles.backdropPressable}
						onPress={onRequestClose}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.drawer,
						{
							height: drawerHeight,
							backgroundColor: colors.background || '#1A1A1A',
							transform: [{ translateY }],
						},
					]}
					pointerEvents={visible ? 'auto' : 'none'}>
					<View
						style={[
							styles.drawerHeader,
							{ borderBottomColor: 'rgba(255,255,255,0.1)' },
						]}>
						<View style={styles.headerContent}>
							<Text
								style={[
									styles.drawerTitle,
									{ color: colors.text },
								]}
								numberOfLines={1}>
								Pickup — {currentItem?.attendeeName ?? 'Pickup'}
							</Text>
							{items.length > 1 ? (
								<Text
									style={[
										styles.subtitle,
										{ color: colors.textSecondary },
									]}
									numberOfLines={1}>
									Swipe for another person ({pageIndex + 1} of{' '}
									{items.length})
								</Text>
							) : (
								<Text
									style={[
										styles.oneScanNote,
										{ color: colors.textSecondary },
									]}>
									One scan checks out this person only.
								</Text>
							)}
						</View>
						<TouchableOpacity
							onPress={onRequestClose}
							style={styles.closeButton}>
							<Icon
								name='close'
								size={28}
								color={colors.text}
							/>
						</TouchableOpacity>
					</View>
					<View style={styles.qrWrapper}>
						<ScrollView
							ref={scrollRef}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							onMomentumScrollEnd={handleScroll}
							onScrollEndDrag={handleScroll}
							scrollEventThrottle={16}
							contentContainerStyle={styles.qrScrollContent}
							style={styles.qrScroll}>
							{items.map((item, index) => (
								<View
									key={item.token ?? index}
									style={[
										styles.qrPage,
										{ width: PAGE_WIDTH },
									]}>
									<View style={styles.qrContainer}>
										{(item.payload ?? item.token) ? (
											<QRCodeDisplay
												key={item.token ?? index}
												payload={
													item.payload ?? item.token
												}
												size={260}
												color='#000000'
												backgroundColor='#FFFFFF'
											/>
										) : (
											<View
												style={[
													styles.qrPlaceholder,
													{ width: 260, height: 260 },
												]}>
												<Text
													style={[
														styles.qrPlaceholderText,
														{
															color: colors.textSecondary,
														},
													]}>
													No checkout code available
												</Text>
											</View>
										)}
									</View>
								</View>
							))}
						</ScrollView>
						{items.length > 1 ? (
							<View style={styles.dots}>
								{items.map((_, i) => (
									<View
										key={i}
										style={[
											styles.dot,
											i === pageIndex && styles.dotActive,
											{
												backgroundColor:
													colors.textSecondary,
											},
										]}
									/>
								))}
							</View>
						) : null}
					</View>
					<View style={styles.footer}>
						<Button
							type='primary'
							text='Close'
							onPress={onRequestClose}
							primaryColor={bg}
						/>
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	backdropPressable: {
		flex: 1,
	},
	drawer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	drawerHeader: {
		paddingTop: Platform.OS === 'ios' ? 50 : 20,
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerContent: {
		flex: 1,
		marginRight: 12,
	},
	drawerTitle: {
		...typography.h3,
		fontSize: 20,
		fontWeight: '600',
	},
	subtitle: {
		...typography.bodyMedium,
		fontSize: 14,
		marginTop: 4,
	},
	oneScanNote: {
		...typography.bodySmall,
		fontSize: 12,
		marginTop: 6,
		opacity: 0.9,
	},
	closeButton: {
		padding: 4,
	},
	qrWrapper: {
		flex: 1,
		minHeight: 280,
	},
	qrScroll: {
		flex: 1,
	},
	qrScrollContent: {
		alignItems: 'center',
	},
	qrPage: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 28,
	},
	qrContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	dots: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 12,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		opacity: 0.4,
	},
	dotActive: {
		opacity: 1,
		transform: [{ scale: 1.2 }],
	},
	qrPlaceholder: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	qrPlaceholderText: {
		...typography.body,
		textAlign: 'center',
	},
	footer: {
		padding: 20,
		paddingBottom: Platform.OS === 'ios' ? 36 : 20,
	},
});

export default PickupQRDrawer;
