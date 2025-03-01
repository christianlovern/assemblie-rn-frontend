import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // or use any other icon library
import globalStyles from '../styles/globalStyles';
import { useData } from '../../context';
import { lightenColor } from '../helper/colorFixer';

const InputWithIcon = ({
	value,
	onChangeText,
	inputType = 'text',
	primaryColor,
}) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const togglePasswordVisibility = () =>
		setIsPasswordVisible(!isPasswordVisible);

	const getIcon = () => {
		switch (inputType) {
			case 'email':
				return (
					<Icon
						name='envelope'
						size={20}
						color={lightenColor(primaryColor)}
					/>
				);
			case 'password':
			case 'confirmPassword':
				return (
					<Icon
						name='lock'
						size={20}
						color={lightenColor(primaryColor)}
					/>
				);
			case 'pin':
				return (
					<Icon
						name='key'
						size={20}
						color={lightenColor(primaryColor)}
					/>
				);
			case 'phone':
				return (
					<Icon
						name='phone'
						size={20}
						color={lightenColor(primaryColor)}
					/>
				);
			case 'user-first' || 'user-last':
				return (
					<Icon
						name='user'
						size={20}
						color={lightenColor(primaryColor)}
					/>
				);
			default:
				return (
					<Icon
						name='user'
						size={20}
						color={lightenColor(primaryColor)}
					/>
				);
		}
	};

	const getPlaceholder = () => {
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
		<View style={styles.container}>
			<View
				style={[
					styles.inputContainer,
					{
						borderColor: lightenColor(primaryColor),
						backgroundColor: primaryColor,
					},
				]}>
				{/* Left Icon */}
				<View
					style={{
						width: 30,
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					{getIcon()}
				</View>

				{/* Text Input */}
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={getPlaceholder()}
					placeholderTextColor={primaryColor}
					secureTextEntry={
						(inputType === 'password' ||
							inputType === 'confirmPassword') &&
						!isPasswordVisible
					}
					style={styles.textInput}
				/>

				{/* Eye Icon (For Password/Confirm Password) */}
				{(inputType === 'password' ||
					inputType === 'confirmPassword') && (
					<View
						style={{
							width: 50,
							height: 60,
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Icon
							name={isPasswordVisible ? 'eye-slash' : 'eye'}
							size={20}
							color={primaryColor}
							onPress={togglePasswordVisibility}
						/>
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 15,
		paddingHorizontal: 10,
		height: 60,
	},
	textInput: {
		flex: 1,
		color: 'white',
		marginLeft: 10,
	},
});

export default InputWithIcon;
