import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import QRCode from 'qrcode';

const OrgQRCode = ({ orgPin }) => {
	const [qrCodeUrl, setQrCodeUrl] = useState('');

	useEffect(() => {
		generateQRCode();
	}, [orgPin]);

	const generateQRCode = async () => {
		try {
			// Create both HTTPS and custom scheme deep links
			const httpsDeepLink = `https://assemblie.app/pinauth?orgPin=${orgPin}`;
			const customSchemeLink = `assemblie://pinauth?orgPin=${orgPin}`;

			// Use HTTPS link for better compatibility
			const qrCodeDataUrl = await QRCode.toDataURL(httpsDeepLink);
			setQrCodeUrl(qrCodeDataUrl);
		} catch (err) {
			console.error('Error generating QR code:', err);
		}
	};

	return (
		<View style={{ alignItems: 'center' }}>
			{qrCodeUrl ? (
				<Image
					source={{ uri: qrCodeUrl }}
					style={{ width: 200, height: 200 }}
				/>
			) : null}
		</View>
	);
};

export default OrgQRCode;
