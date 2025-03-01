import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tinycolor from 'tinycolor2';

const lightenColor = (color, amount = 20) => {
	return tinycolor(color).lighten(amount).toHexString();
};

const Button = ({
	type = 'primary',
	primaryColor = '#332E82',
	secondaryColor = '#791951',
	text,
	icon,
	onPress,
	disabled = false,
	style = {},
	textStyle = {},
}) => {
	const lightPrimary = lightenColor(primaryColor, 20);
	const lightSecondary = lightenColor(secondaryColor, 20);

	const buttonContent = icon || (
		<Text style={[styles.text, { color: 'white' }, textStyle]}>{text}</Text>
	);

	const getButtonStyles = () => {
		const baseStyles = [styles.button];

		switch (type) {
			case 'primary':
				return [
					...baseStyles,
					{ backgroundColor: lightPrimary },
					style,
				];

			case 'secondary':
				return [
					...baseStyles,
					{ backgroundColor: lightSecondary },
					style,
				];

			case 'hollow':
				return [
					...baseStyles,
					styles.hollowButton,
					{
						borderColor: lightPrimary,
						backgroundColor: primaryColor,
					},
					style,
				];

			case 'gradient':
				return [...baseStyles, style];

			default:
				return baseStyles;
		}
	};

	if (type === 'gradient') {
		return (
			<LinearGradient
				colors={[lightPrimary, lightSecondary]}
				style={getButtonStyles()}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}>
				<TouchableOpacity
					style={[styles.gradientOverlay, style]}
					onPress={onPress}
					disabled={disabled}
					activeOpacity={1}>
					{buttonContent}
				</TouchableOpacity>
			</LinearGradient>
		);
	}

	return (
		<TouchableOpacity
			style={getButtonStyles()}
			onPress={onPress}
			disabled={disabled}
			activeOpacity={1}>
			{buttonContent}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 150,
		marginBottom: 20,
		minHeight: 65,
	},
	text: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	hollowButton: {
		borderWidth: 2,
	},
	gradientOverlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%',
	},
});

export default Button;
