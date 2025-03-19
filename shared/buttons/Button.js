import React from 'react';
import {
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tinycolor from 'tinycolor2';
import { typography } from '../styles/typography';
import { useTheme } from '../../contexts/ThemeContext';

const lightenColor = (color, amount = 20) => {
	return tinycolor(color).lighten(amount).toHexString();
};

const Button = ({
	type = 'primary',
	text,
	icon,
	onPress,
	disabled = false,
	style = {},
	textStyle = {},
	loading = false,
}) => {
	const { colors } = useTheme();
	const buttonTheme = colors.buttons[type];

	const buttonContent = loading ? (
		<ActivityIndicator
			color={buttonTheme.text}
			size='small'
			animating={true}
			hidesWhenStopped={false}
		/>
	) : (
		icon || (
			<Text style={[styles.text, { color: buttonTheme.text }, textStyle]}>
				{text}
			</Text>
		)
	);

	const getButtonStyles = () => {
		const baseStyles = [styles.button];

		switch (type) {
			case 'primary':
			case 'secondary':
				return [
					...baseStyles,
					{
						backgroundColor: buttonTheme.background,
						borderColor: buttonTheme.border,
						borderWidth:
							buttonTheme.border !== 'transparent' ? 2 : 0,
					},
					style,
				];

			case 'hollow':
				return [
					...baseStyles,
					styles.hollowButton,
					{
						borderColor: buttonTheme.border,
						backgroundColor: buttonTheme.background,
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
				colors={[buttonTheme.from, buttonTheme.to]}
				style={getButtonStyles()}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}>
				<TouchableOpacity
					style={[styles.gradientOverlay, style]}
					onPress={onPress}
					disabled={disabled || loading}
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
			disabled={disabled || loading}
			activeOpacity={1}>
			{buttonContent}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		paddingHorizontal: 20,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 150,
		marginBottom: 20,
		height: 65,
	},
	text: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
		color: 'white',
		...typography.button,
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
