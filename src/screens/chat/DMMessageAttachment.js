import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { directMessageApi } from '../../../api/directMessageRoutes';
import { typography } from '../../../shared/styles/typography';

function formatFileSize(bytes) {
	if (bytes == null || bytes < 1024) return `${bytes || 0} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Renders one attachment: image preview for image/*, file chip for documents (like TeamChatScreen). */
export default function DMMessageAttachment({
	conversationId,
	messageId,
	att,
	isOwn,
	colors,
	onPress,
	onLongPress,
}) {
	const [imageUri, setImageUri] = useState(null);
	const isImage = att.mimeType && att.mimeType.startsWith('image/');

	useEffect(() => {
		if (!isImage) return;
		let cancelled = false;
		directMessageApi
			.getAttachmentDownloadUrl(conversationId, messageId, att.id)
			.then((res) => {
				if (!cancelled && res?.url) setImageUri(res.url);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [conversationId, messageId, att.id, isImage]);

	if (isImage) {
		if (imageUri) {
			return (
				<TouchableOpacity
					style={[styles.attachmentImageWrap, isOwn && styles.attachmentImageWrapOwn]}
					onPress={() => onPress(messageId, att)}
					onLongPress={onLongPress}
					delayLongPress={400}
					activeOpacity={0.8}>
					<Image
						source={{ uri: imageUri }}
						style={styles.attachmentImage}
						resizeMode="cover"
					/>
				</TouchableOpacity>
			);
		}
		return (
			<View
				style={[
					styles.attachmentImageWrap,
					styles.attachmentImagePlaceholder,
					isOwn && styles.attachmentImageWrapOwn,
				]}>
				<Icon name="image-outline" size={40} color={colors.textSecondary} />
			</View>
		);
	}

	const fileName = att.originalName || 'Document';
	const fileSizeStr = att.fileSize != null ? formatFileSize(att.fileSize) : null;
	const isPdf =
		att.mimeType === 'application/pdf' ||
		(fileName && fileName.toLowerCase().endsWith('.pdf'));

	return (
		<TouchableOpacity
			style={[
				styles.attachmentChip,
				{
					backgroundColor: isOwn
						? 'rgba(255,255,255,0.2)'
						: colors.textSecondary + '25',
				},
			]}
			onPress={() => onPress(messageId, att)}
			onLongPress={onLongPress}
			delayLongPress={400}
			activeOpacity={0.7}>
			<View style={styles.attachmentFileIconWrap}>
				<Icon
					name={isPdf ? 'file-pdf-box' : 'file-document-outline'}
					size={32}
					color={isOwn ? '#fff' : colors.primary}
				/>
			</View>
			<View style={styles.attachmentFileTextWrap}>
				<Text
					style={[
						styles.attachmentFileName,
						{ color: isOwn ? '#fff' : colors.text },
					]}
					numberOfLines={2}>
					{fileName}
				</Text>
				{fileSizeStr != null && (
					<Text
						style={[
							styles.attachmentFileSize,
							{
								color: isOwn
									? 'rgba(255,255,255,0.8)'
									: colors.textSecondary,
							},
						]}>
						{fileSizeStr}
					</Text>
				)}
			</View>
			<Icon
				name="open-in-new"
				size={18}
				color={isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary}
				style={styles.attachmentFileChevron}
			/>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	attachmentChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		gap: 12,
		maxWidth: '100%',
		minWidth: 160,
	},
	attachmentFileIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 8,
		backgroundColor: 'rgba(0,0,0,0.06)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	attachmentFileTextWrap: {
		flex: 1,
		minWidth: 0,
		justifyContent: 'center',
	},
	attachmentFileName: {
		...typography.body,
		fontSize: 15,
		fontWeight: '500',
	},
	attachmentFileSize: {
		...typography.bodySmall,
		fontSize: 12,
		marginTop: 2,
	},
	attachmentFileChevron: {
		marginLeft: 4,
	},
	attachmentImageWrap: {
		width: 200,
		height: 200,
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: 'rgba(0,0,0,0.06)',
	},
	attachmentImageWrapOwn: {
		alignSelf: 'flex-end',
	},
	attachmentImage: {
		width: '100%',
		height: '100%',
	},
	attachmentImagePlaceholder: {
		alignItems: 'center',
		justifyContent: 'center',
	},
});
