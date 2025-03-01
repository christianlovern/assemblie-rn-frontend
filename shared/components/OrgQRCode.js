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
			const deepLink = `yourapp://pinauth?orgPin=${orgPin}`;
			const qrCodeDataUrl = await QRCode.toDataURL(deepLink);
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
