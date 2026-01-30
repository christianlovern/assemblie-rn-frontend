import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import QRCode from 'qrcode';

const OrgQRCode = ({ orgId, orgPin }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orgId && orgPin) {
            generateQRCode();
        }
    }, [orgId, orgPin]);

    const generateQRCode = async () => {
        try {
            setLoading(true);
            const connectionLink = `https://assemblie.app/connect?orgId=${orgId}&orgPin=${orgPin}`;

            const qrCodeDataUrl = await QRCode.toDataURL(connectionLink, {
                width: 400, // Higher resolution for better scanning
                margin: 2,
                errorCorrectionLevel: 'H' // High error correction
            });
            
            setQrCodeUrl(qrCodeDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : qrCodeUrl ? (
                <Image
                    source={{ uri: qrCodeUrl }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                />
            ) : null}
        </View>
    );
};

export default OrgQRCode;