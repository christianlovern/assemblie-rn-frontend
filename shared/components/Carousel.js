import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import Icon from 'react-native-vector-icons/AntDesign';
import { useData } from '../../context';
import AnnouncementCard from './AnnouncementCard';
import EventCard from './EventCard';
import CarouselModal from './CarouselModal';
import { lightenColor } from '../helper/colorFixer';

const dimensions = Dimensions.get('window');
const screenWidth = dimensions.width;

const Carousel = ({ type, cards }) => {
	const pagerRef = useRef(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [currentCard, setCurrentCard] = useState({});
	const { organization } = useData();
	const [isEventModalVisible, setIsEventModalVisible] = useState(false);

	const handlePageSelected = (event) => {
		const selectedPage = event.nativeEvent.position;
		setCurrentPage(selectedPage);
	};

	const handleResetToFirstPage = () => {
		pagerRef.current.setPage(0);
	};

	const handleCardPress = (card) => {
		setCurrentCard(card);
		setIsEventModalVisible(true);
	};

	const renderPaginationDots = () => {
		const dots = [];
		const totalDots = 3;
		const lightPrimary = organization.primaryColor;
		const lightSecondary = organization.secondaryColor;

		for (let i = 0; i < totalDots; i++) {
			let dotColor;

			if (currentPage === 0) {
				// First card
				dotColor = i === 0 ? lightPrimary : lightSecondary;
			} else if (currentPage === cards.length - 1) {
				// Last card
				dotColor = i === totalDots - 1 ? lightPrimary : lightSecondary;
			} else {
				// Middle cards
				dotColor = i === 1 ? lightPrimary : lightSecondary;
			}

			dots.push(
				<View
					key={i}
					style={[
						styles.paginationDot,
						{ backgroundColor: dotColor },
					]}
				/>
			);
		}

		return <View style={styles.paginationContainer}>{dots}</View>;
	};

	return (
		<View style={styles.container}>
			{isEventModalVisible && (
				<CarouselModal
					type={type}
					visible={isEventModalVisible}
					onRequestClose={() => setIsEventModalVisible(false)}
					data={currentCard}
				/>
			)}
			<PagerView
				ref={pagerRef}
				style={styles.carousel}
				initialPage={0}
				onPageSelected={handlePageSelected}>
				{cards.map((card, index) => (
					<View
						key={index}
						style={styles.cardContainer}>
						{type === 'announcements' ? (
							<AnnouncementCard
								announcement={card}
								onPress={() => handleCardPress(card)}
								primaryColor={organization.primaryColor}
								secondaryColor={organization.secondaryColor}
								variant='carousel'
							/>
						) : (
							<EventCard
								event={card}
								onPress={() => handleCardPress(card)}
								primaryColor={organization.primaryColor}
								variant='carousel'
							/>
						)}
					</View>
				))}
			</PagerView>

			{renderPaginationDots()}

			{currentPage === cards.length - 1 && (
				<View
					style={[
						styles.arrowIconContainer,
						{ backgroundColor: organization.primaryColor },
					]}>
					<Icon
						name='arrowleft'
						size={30}
						color='#FFF'
						onPress={handleResetToFirstPage}
					/>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
	},
	carousel: {
		height: '100%',
		width: screenWidth,
	},
	cardContainer: {
		flex: 1,
		paddingHorizontal: 20,
		paddingVertical: 10,
		justifyContent: 'center',
	},
	arrowIconContainer: {
		position: 'absolute',
		top: '40%',
		right: 0,
		transform: [{ translateY: -15 }],
		padding: 10,
		borderRadius: 50,
	},
	paginationContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		bottom: 20,
		left: 0,
		right: 0,
	},
	paginationDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginHorizontal: 4,
	},
});

export default Carousel;
