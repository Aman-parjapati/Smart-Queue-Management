const QRCode = require('qrcode');

/**
 * Generates a base64 PNG QR code for a booking.
 * The QR content is a JSON string with bookingId for scanning.
 */
async function generateQRCode(bookingId) {
  const payload = JSON.stringify({ bookingId, type: 'smart-queue-checkin' });
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });
  return dataUrl;
}

module.exports = { generateQRCode };
