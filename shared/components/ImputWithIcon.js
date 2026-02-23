import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { lightenColor } from '../helper/colorFixer';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const InputWithIcon = ({
	value,
	onChangeText,
	inputType = 'text',
	primaryColor,
	placeholder,
	error,
	autoComplete,
	autoCorrect = true,
	...restProps
}) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const { colors, colorMode } = useTheme();

	const togglePasswordVisibility = () =>
		setIsPasswordVisible(!isPasswordVisible);

	// Use the same color as the primary button to ensure consistency
	// The primary button uses colors.buttons.primary.background
	const iconColor =
		primaryColor ||
		colors.buttons?.primary?.background ||
		colors.primary ||
		'#6366f1';

	const getIcon = () => {
		switch (inputType) {
			case 'email':
				return (
					<Icon
						name='envelope'
						size={20}
						color={iconColor}
					/>
				);
			case 'password':
			case 'confirmPassword':
				return (
					<Icon
						name='lock'
						size={20}
						color={iconColor}
					/>
				);
			case 'pin':
				return (
					<Icon
						name='key'
						size={20}
						color={iconColor}
					/>
				);
			case 'phone':
				return (
					<Icon
						name='phone'
						size={20}
						color={iconColor}
					/>
				);
			case 'user-first':
			case 'user-last':
				return (
					<Icon
						name='user'
						size={20}
						color={iconColor}
					/>
				);
			default:
				return (
					<Icon
						name='user'
						size={20}
						color={iconColor}
					/>
				);
		}
	};

	const getPlaceholder = () => {
		if (placeholder) {
			return placeholder;
		}
		switch (inputType) {
			case 'email':
				return 'Email';
			case 'password':
				return 'Password';
			case 'confirmPassword':
				return 'Confirm Password';
			case 'pin':
				return 'Church PIN';
			case 'phone':
				return 'Phone Number';
			case 'user-first':
				return 'First Name';
			case 'user-last':
				return 'Last Name';
			default:
				return 'Enter text';
		}
	};

	const errorColor = colors.error || '#a44c62';

	return (
		<View style={styles.wrapper}>
			<View
				style={[
					styles.inputInnerContainer,
					{
						borderColor: error
							? errorColor
							: lightenColor(iconColor),
						backgroundColor:
							colorMode === 'dark'
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(255, 255, 255, 0.9)',
					},
				]}>
				<View style={styles.iconWrapper}>{getIcon()}</View>

				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={getPlaceholder()}
					placeholderTextColor={colors.textSecondary}
					secureTextEntry={
						(inputType === 'password' ||
							inputType === 'confirmPassword') &&
						!isPasswordVisible
					}
					autoComplete={
						autoComplete ??
						(inputType === 'pin' ? 'off' : undefined)
					}
					autoCorrect={inputType === 'pin' ? false : autoCorrect}
					style={[
						styles.input,
						{
							fontFamily: typography.body.fontFamily,
							fontSize: typography.body.fontSize,
							color: colors.text,
						},
					]}
					{...restProps}
				/>

				{(inputType === 'password' ||
					inputType === 'confirmPassword') && (
					<TouchableOpacity
						style={styles.eyeIconWrapper}
						onPress={togglePasswordVisibility}
						activeOpacity={0.7}>
						<Icon
							name={isPasswordVisible ? 'eye-slash' : 'eye'}
							size={20}
							color={iconColor}
						/>
					</TouchableOpacity>
				)}
			</View>
			{error ? (
				<Text
					style={[styles.errorText, { color: errorColor }]}
					numberOfLines={2}>
					{error}
				</Text>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 15,
	},
	inputInnerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 10,
		height: 50,
		borderWidth: 1,
	},
	errorText: {
		fontSize: 14,
		marginTop: 4,
		marginLeft: 4,
		fontWeight: '600',
	},
	iconWrapper: {
		paddingHorizontal: 10,
	},
	input: {
		flex: 1,
		height: '100%',
	},
	eyeIconWrapper: {
		paddingHorizontal: 10,
	},
});

export default InputWithIcon;
