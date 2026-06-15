const twilio = require('twilio');
const { sendLocalWhatsApp } = require('./whatsappService');

let client;
function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

/**
 * Sends an SMS notification to a customer phone number.
 */
async function sendSMS(to, message, mediaUrl = null) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS mock] To: ${to} | Message: ${message} | MediaUrl: ${mediaUrl}`);
    return;
  }
  try {
    const payload = {
      body: message,
      from: process.env.TWILIO_PHONE,
      to,
    };
    if (mediaUrl) {
      payload.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    }
    await getClient().messages.create(payload);
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
  }
}

/**
 * Sends a WhatsApp notification (requires WhatsApp-enabled Twilio number).
 */
async function sendWhatsApp(to, message, mediaUrl = null) {
  if (process.env.ENABLE_LOCAL_WHATSAPP === 'true') {
    await sendLocalWhatsApp(to, message, mediaUrl);
    return;
  }

  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[WhatsApp mock] To: ${to} | Message: ${message} | MediaUrl: ${mediaUrl}`);
    return;
  }
  try {
    const payload = {
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE}`,
      to: `whatsapp:${to}`,
    };
    if (mediaUrl) {
      payload.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    }
    await getClient().messages.create(payload);
  } catch (err) {
    console.error('Twilio WhatsApp error:', err.message);
  }
}

/**
 * Notifies customer that their turn is near (2 tokens away).
 */
async function notifyTurnNear(phone, tokenNumber, businessName) {
  const msg = `🔔 SmartQueue Alert: Your token #${tokenNumber} at ${businessName} is coming up soon! Please be ready.`;
  await sendSMS(phone, msg);
}

/**
 * Sends booking confirmation SMS and WhatsApp with QR code.
 */
async function sendBookingConfirmation(phone, bookingId, tokenNumber, businessName, date, startTime, endTime) {
  const timeStr = `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  const msg = `🎉 SmartQueue Confirmation: Your booking is confirmed at ${businessName}!\n\n📅 Date: ${date}\n⏰ Time: ${timeStr}\n🎫 Token: #${String(tokenNumber).padStart(3, '0')}\n🆔 Booking ID: ${bookingId}\n\nHere is your check-in QR code.`;

  const mediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${bookingId}`;

  // Send to SMS
  await sendSMS(phone, msg, mediaUrl);

  // Send to WhatsApp
  await sendWhatsApp(phone, msg, mediaUrl);
}

module.exports = { sendSMS, sendWhatsApp, notifyTurnNear, sendBookingConfirmation };
