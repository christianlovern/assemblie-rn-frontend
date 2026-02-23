import { useCallback } from 'react';

const DEFAULT_OFFSET = 80;

/**
 * Reusable hook to scroll a ScrollView to the first field that has an error.
 * Use with a scroll view whose content is wrapped in a single View (contentRef).
 *
 * @param {React.RefObject} scrollViewRef - Ref attached to the ScrollView (or KeyboardAwareScrollView that forwards to ScrollView).
 * @param {React.RefObject} contentRef - Ref attached to the single View that wraps all scroll content (so field Y is relative to it).
 * @param {Record<string, React.RefObject>} fieldRefs - Map of field key to ref for that field's wrapper View, e.g. { firstName: firstNameRef, phone: phoneRef }.
 * @param {string[]} fieldOrder - Order of field keys; first key with an error is scrolled to, e.g. ['firstName', 'lastName', 'phone'].
 * @param {{ scrollOffset?: number }} options - Optional. scrollOffset = pixels above the target (default 80).
 * @returns {{ scrollToFirstError: (errors: Record<string, string>) => void }}
 */
export function useScrollToFirstError(
	scrollViewRef,
	contentRef,
	fieldRefs,
	fieldOrder,
	options = {},
) {
	const { scrollOffset = DEFAULT_OFFSET } = options;

	const scrollToFirstError = useCallback(
		(errors) => {
			if (!errors || typeof errors !== 'object') return;
			const scrollView = scrollViewRef?.current;
			const content = contentRef?.current;
			if (!scrollView || !content) return;

			const firstKey = fieldOrder.find((key) => errors[key]);
			if (!firstKey) return;

			const fieldRef = fieldRefs[firstKey];
			if (!fieldRef?.current) return;

			// Run after layout so error messages are visible
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					fieldRef.current.measureLayout(
						content,
						(_x, y) => {
							const yOffset = Math.max(0, y - scrollOffset);
							scrollView.scrollTo({
								y: yOffset,
								animated: true,
							});
						},
						() => {
							// measureLayout failed (e.g. node not in tree)
						},
					);
				});
			});
		},
		[scrollViewRef, contentRef, fieldRefs, fieldOrder, scrollOffset],
	);

	return { scrollToFirstError };
}
