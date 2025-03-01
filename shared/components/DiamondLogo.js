import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import globalStyles from '../styles/globalStyles';

const DiamondLogo = ({ size = 100 }) => {
	return (
		<Svg
			width={size}
			height={size}
			viewBox='0 0 100 100'
			fill='none'>
			<Defs>
				<LinearGradient
					id='grad'
					x1='50%'
					y1='0%'
					x2='50%'
					y2='100%'>
					<Stop
						offset='0%'
						stopColor={globalStyles.colorPallet.lightPrimary}
					/>
					<Stop
						offset='100%'
						stopColor={globalStyles.colorPallet.lightSecondary}
					/>
				</LinearGradient>
			</Defs>
			<Path
				d='M50 5 L95 50 L50 95 L5 50 Z'
				fill='url(#grad)'
				strokeLinejoin='round'
				strokeLinecap='round'
			/>
		</Svg>
	);
};

export default DiamondLogo;
