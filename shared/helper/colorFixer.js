import tinycolor from 'tinycolor2';

export const lightenColor = (color, amount = 25, opacity = 1) => {
	const lightColor = tinycolor(color).lighten(amount);
	if (opacity === 1) {
		return lightColor.toHexString();
	}
	return lightColor.setAlpha(opacity).toHex8String();
};

export const adjustColor = (color) => {
	const tc = tinycolor(color);
	const adjustmentType = Math.floor(Math.random() * 3);

	switch (adjustmentType) {
		case 0: // Lighten
			return tc.lighten(Math.floor(Math.random() * 30)).toHexString();
		case 1: // Darken
			return tc.darken(Math.floor(Math.random() * 30)).toHexString();
		case 2: // Change Hue (while preserving brightness and saturation)
			return tc.spin(Math.floor(Math.random() * 360)).toHexString();
		default:
			return color;
	}
};
