import React from 'react';
import {
	KeyboardAvoidingView,
	ScrollView,
	Platform,
	StyleSheet,
} from 'react-native';

/**
 * ScrollView that keeps focused text inputs visible above the keyboard.
 * Use this instead of ScrollView on screens with text inputs to avoid the
 * keyboard covering the active input.
 *
 * @param {number} keyboardVerticalOffset - Extra offset (e.g. for nav header). iOS often needs 40-60.
 * @param {object} contentContainerStyle - Passed to ScrollView contentContainerStyle.
 * @param {string} keyboardShouldPersistTaps - 'handled' (default) so buttons work while keyboard is open.
 */
const KeyboardAwareScrollView = ({
	children,
	keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0,
	contentContainerStyle,
	keyboardShouldPersistTaps = 'handled',
	...scrollViewProps
}) => {
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.keyboardAvoid}
			keyboardVerticalOffset={keyboardVerticalOffset}>
			<ScrollView
				contentContainerStyle={contentContainerStyle}
				keyboardShouldPersistTaps={keyboardShouldPersistTaps}
				showsVerticalScrollIndicator={false}
				{...scrollViewProps}>
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	keyboardAvoid: {
		flex: 1,
	},
});

export default KeyboardAwareScrollView;
