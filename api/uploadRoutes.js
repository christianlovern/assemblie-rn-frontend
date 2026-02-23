import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './apiClient';
import { mediaApi } from './mediaRoutes';

/**
 * Read a local file URI (file:// or content://) to base64 for blob uploads (e.g. POST /media).
 * On Android content:// URIs are copied to cache first so they can be read.
 */
export async function uriToBase64(uri, options = {}) {
	if (!uri) throw new Error('uri is required');
	let path = uri;
	if (Platform.OS === 'android' && uri.startsWith('content://')) {
		const ext = options.extension || '.jpg';
		path = `${FileSystem.cacheDirectory}blob_upload_${Date.now()}${ext}`;
		await FileSystem.copyAsync({ from: uri, to: path });
	}
	return FileSystem.readAsStringAsync(path, { encoding: 'base64' });
}

/**
 * On Android, content:// URIs are not readable by the HTTP stack; copy to a cache file first.
 * Exported for use by other upload flows (e.g. contact form with screenshot).
 */
export async function ensureFileUriForUpload(file) {
	if (Platform.OS !== 'android' || !file.uri?.startsWith('content://')) {
		return file;
	}
	const ext =
		(file.name && file.name.includes('.')
			? file.name.slice(file.name.lastIndexOf('.'))
			: '') || '.jpg';
	const cachePath = `${FileSystem.cacheDirectory}avatar_upload_${Date.now()}${ext}`;
	await FileSystem.copyAsync({ from: file.uri, to: cachePath });
	return { ...file, uri: cachePath };
}

/**
 * Use fetch() for multipart uploads so React Native's native layer handles FormData + file URI.
 * Axios on Android can fail with "Network Error" for file uploads.
 * Exported for use by other multipart flows (e.g. contact form with screenshot).
 */
export async function uploadWithFetch(url, formData) {
	const token = await SecureStore.getItemAsync('userToken');
	const authHeader = token?.startsWith('Bearer ')
		? token
		: token
			? `Bearer ${token}`
			: '';
	const headers = {};
	if (authHeader) headers.Authorization = authHeader;
	// Do not set Content-Type: fetch will set multipart/form-data with boundary
	const response = await fetch(url, {
		method: 'POST',
		body: formData,
		headers,
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		const msg = data?.message || data?.error || response.statusText;
		const err = new Error(msg || `Upload failed (${response.status})`);
		err.response = { status: response.status, data };
		throw err;
	}
	return data;
}

async function uploadAvatarAsBlob(orgId, file, blobName) {
	const uri = file.uri;
	const base64 = await uriToBase64(uri);
	const ext =
		(file.name && file.name.includes('.')
			? file.name.slice(file.name.lastIndexOf('.'))
			: '') || (uri.includes('.') ? uri.slice(uri.lastIndexOf('.')) : '') || '.jpg';
	const filename = blobName ? `${blobName}${ext}` : `photo${ext}`;
	const { fileUrl } = await mediaApi.uploadBlob(orgId, {
		name: filename.replace(/^\//, ''),
		fileType: 'image',
		data: base64,
		filename,
		mimetype: 'image/jpeg',
	});
	return fileUrl;
}

export const uploadApi = {
	uploadUserAvatar: async (orgId, userId, file) => {
		const uri = file?.uri;
		const useBlob =
			!uri ||
			uri.startsWith('content://') ||
			(Platform.OS === 'android' && uri.startsWith('content://'));
		if (uri && uri.startsWith('content://')) {
			try {
				return await uploadAvatarAsBlob(orgId, file, 'user-avatar');
			} catch (error) {
				console.error('Failed to upload avatar (blob):', error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					'Upload failed';
				throw new Error(`Failed to upload avatar: ${errorMessage}`);
			}
		}
		try {
			const fileForUpload = await ensureFileUriForUpload(file);
			const formData = new FormData();
			const extension =
				(fileForUpload.uri && fileForUpload.uri.includes('.')
					? fileForUpload.uri.split('.').pop()
					: 'jpg') || 'jpg';

			formData.append('file', {
				uri: fileForUpload.uri,
				type: 'image/jpeg',
				name: `photo.${extension}`,
			});

			const data = await uploadWithFetch(
				`${API_BASE_URL}/api/uploads/${orgId}/avatars/${userId}`,
				formData,
			);

			if (!data.fileUrl) {
				throw new Error('No file URL received from server');
			}

			return data.fileUrl;
		} catch (error) {
			// Fallback to blob upload when FormData fails (e.g. on some devices)
			if (uri && (uri.startsWith('file://') || uri.startsWith('content://'))) {
				try {
					return await uploadAvatarAsBlob(orgId, file, 'user-avatar');
				} catch (blobErr) {
					console.error('Failed to upload avatar (blob fallback):', blobErr);
				}
			}
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Upload failed';
			throw new Error(`Failed to upload avatar: ${errorMessage}`);
		}
	},

	uploadAvatar: async (orgId, familyMemberId, file, newMember) => {
		const uri = file?.uri;
		if (uri && uri.startsWith('content://')) {
			try {
				const blobName = newMember
					? `${newMember.firstName}_${newMember.lastName}_avatar`.replace(
							/\s+/g,
							'_',
						)
					: 'family-avatar';
				return await uploadAvatarAsBlob(orgId, file, blobName);
			} catch (error) {
				console.error('Failed to upload avatar (blob):', error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					'Upload failed';
				throw new Error(`Failed to upload avatar: ${errorMessage}`);
			}
		}
		try {
			const fileForUpload = await ensureFileUriForUpload(file);
			const formData = new FormData();
			const extension =
				(fileForUpload.uri && fileForUpload.uri.includes('.')
					? fileForUpload.uri.split('.').pop()
					: 'jpg') || 'jpg';

			formData.append('file', {
				uri: fileForUpload.uri,
				type: 'image/jpeg',
				name: `${newMember.firstName}_${newMember.lastName}_avatar.${extension}`,
			});

			const data = await uploadWithFetch(
				`${API_BASE_URL}/api/uploads/${orgId}/family-members/avatar/${familyMemberId}`,
				formData,
			);

			if (!data.fileUrl) {
				throw new Error('No file URL received from server');
			}

			return data.fileUrl;
		} catch (error) {
			if (uri && (uri.startsWith('file://') || uri.startsWith('content://'))) {
				try {
					const blobName = newMember
						? `${newMember.firstName}_${newMember.lastName}_avatar`.replace(
								/\s+/g,
								'_',
							)
						: 'family-avatar';
					return await uploadAvatarAsBlob(orgId, file, blobName);
				} catch (blobErr) {
					console.error('Failed to upload avatar (blob fallback):', blobErr);
				}
			}
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Upload failed';
			throw new Error(`Failed to upload avatar: ${errorMessage}`);
		}
	},
};
