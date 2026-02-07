import React from 'react';
import QRCodeDisplay from './QRCodeDisplay';

/**
 * QR code for organization connection (join/link). Encodes the public connection URL.
 * For other QR use cases (e.g. checkout token, ministry check-in link) use QRCodeDisplay directly.
 */
const OrgQRCode = ({ orgId, orgPin, size = 200, style }) => {
	const connectionLink =
		orgId && orgPin
			? `https://assemblie.app/connect?orgId=${orgId}&orgPin=${orgPin}`
			: null;

	return (
		<QRCodeDisplay
			payload={connectionLink}
			size={size}
			style={style}
		/>
	);
};

export default OrgQRCode;
