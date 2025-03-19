import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { lightenColor } from '../helper/colorFixer';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../styles/typography';

const InputWithIcon = ({
	value,
	onChangeText,
	inputType = 'text',
	primaryColor,
	placeholder,
}) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const { colors } = useTheme();

	const togglePasswordVisibility = () =>
		setIsPasswordVisible(!isPasswordVisible);

	const getIcon = () => {
		switch (inputType) {
			case 'email':
				return (
					<Icon
						name='envelope'
						size={20}
						color={lightenColor(colors.secondary)}
					/>
				);
			case 'password':
			case 'confirmPassword':
				return (
					<Icon
						name='lock'
						size={20}
						color={lightenColor(colors.secondary)}
					/>
				);
			case 'pin':
				return (
					<Icon
						name='key'
						size={20}
						color={lightenColor(colors.secondary)}
					/>
				);
			case 'phone':
				return (
					<Icon
						name='phone'
						size={20}
						color={lightenColor(colors.secondary)}
					/>
				);
			case 'user-first':
			case 'user-last':
				return (
					<Icon
						name='user'
						size={20}
						color={lightenColor(colors.secondary)}
					/>
				);
			default:
				return (
					<Icon
						name='user'
						size={20}
						color={lightenColor(colors.secondary)}
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
				return 'Guest PIN';
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

	return (
		<View
			style={[
				styles.inputContainer,
				{ backgroundColor: lightenColor(primaryColor, 50, 0.1) },
			]}>
			<View
				style={[
					styles.inputInnerContainer,
					{
						borderColor: lightenColor(primaryColor),
						backgroundColor: primaryColor,
					},
				]}>
				<View style={styles.iconWrapper}>{getIcon()}</View>

				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={getPlaceholder()}
					placeholderTextColor='rgba(255, 255, 255, 0.6)'
					secureTextEntry={
						(inputType === 'password' ||
							inputType === 'confirmPassword') &&
						!isPasswordVisible
					}
					style={[
						styles.input,
						{
							fontFamily: typography.body.fontFamily,
							fontSize: typography.body.fontSize,
							color: '#FFFFFF',
						},
					]}
				/>

				{(inputType === 'password' ||
					inputType === 'confirmPassword') && (
					<View style={styles.eyeIconWrapper}>
						<Icon
							name={isPasswordVisible ? 'eye-slash' : 'eye'}
							size={20}
							color={lightenColor(colors.secondary)}
							onPress={togglePasswordVisibility}
						/>
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	inputContainer: {
		width: '100%',
		marginBottom: 15,
		borderRadius: 10,
		padding: 10,
	},
	inputInnerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 10,
		backgroundColor: '#FFFFFF99',
		height: 50,
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
