import React, { useMemo } from 'react';
import { Text, Linking, StyleSheet } from 'react-native';

/**
 * Matches http://, https://, and optionally www. in a single pass.
 * Trailing punctuation is stripped when opening the URL.
 */
const URL_REGEX = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

function trimTrailingPunctuation(url) {
	return url.replace(/[.,;:!?)\]'"]+$/, '');
}

/**
 * Splits text into segments of plain text and URLs (one pass over the string).
 * @param {string} text
 * @returns {{ type: 'text' | 'url', value: string }[]}
 */
export function parseTextWithLinks(text) {
	if (typeof text !== 'string' || !text) return [];
	const segments = [];
	let lastIndex = 0;
	let match;
	// Reset regex state for reuse
	URL_REGEX.lastIndex = 0;
	while ((match = URL_REGEX.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({
				type: 'text',
				value: text.slice(lastIndex, match.index),
			});
		}
		segments.push({ type: 'url', value: match[1] });
		lastIndex = match.index + match[1].length;
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', value: text.slice(lastIndex) });
	}
	return segments;
}

/**
 * Renders text with detected URLs tappable; opens in device browser.
 * Optimized: parses once per text string (memoized).
 */
const LinkableText = ({ text, style, linkStyle, numberOfLines, ...rest }) => {
	const segments = useMemo(() => parseTextWithLinks(text || ''), [text]);

	if (segments.length === 0) {
		return (
			<Text
				style={style}
				numberOfLines={numberOfLines}
				{...rest}>
				{text}
			</Text>
		);
	}

	const handlePressLink = (rawUrl) => {
		const url = trimTrailingPunctuation(rawUrl);
		const toOpen = /^https?:\/\//i.test(url) ? url : `https://${url}`;
		Linking.openURL(toOpen).catch(() => {});
	};

	return (
		<Text
			style={style}
			numberOfLines={numberOfLines}
			{...rest}>
			{segments.map((seg, index) =>
				seg.type === 'url' ? (
					<Text
						key={`link-${index}`}
						onPress={() => handlePressLink(seg.value)}
						style={[
							style,
							linkStyle,
							styles.link,
							{
								fontWeight: 'bold !important',
							},
						]}>
						{seg.value}
					</Text>
				) : (
					seg.value
				),
			)}
		</Text>
	);
};

const styles = StyleSheet.create({
	link: {
		textDecorationLine: 'underline',
	},
});

export default LinkableText;
