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
 * For scroll-to-first-error, pass scrollViewRef (ref to the inner ScrollView).
 *
 * @param {React.RefObject} scrollViewRef - Optional ref forwarded to the inner ScrollView (e.g. for scrollTo).
 * @param {number} keyboardVerticalOffset - Extra offset (e.g. for nav header). iOS often needs 40-60.
 * @param {object} contentContainerStyle - Passed to ScrollView contentContainerStyle.
 * @param {string} keyboardShouldPersistTaps - 'handled' (default) so buttons work while keyboard is open.
 */
function KeyboardAwareScrollView({
	children,
	scrollViewRef,
	keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0,
	contentContainerStyle,
	keyboardShouldPersistTaps = 'handled',
	...scrollViewProps
}) {
	// On Android, avoid conflicting with windowSoftInputMode="adjustResize"—let the window
	// resize and the ScrollView scroll. On iOS, use 'padding' so inputs stay above the keyboard.
	const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

	return (
		<KeyboardAvoidingView
			behavior={behavior}
			style={styles.keyboardAvoid}
			keyboardVerticalOffset={keyboardVerticalOffset}>
			<ScrollView
				ref={scrollViewRef}
				contentContainerStyle={contentContainerStyle}
				keyboardShouldPersistTaps={keyboardShouldPersistTaps}
				showsVerticalScrollIndicator={false}
				{...scrollViewProps}>
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	keyboardAvoid: {
		flex: 1,
	},
});

export default KeyboardAwareScrollView;
