const twilio = require('twilio');

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
async function sendSMS(to, message) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS mock] To: ${to} | Message: ${message}`);
    return;
  }
  try {
    await getClient().messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to,
    });
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
  }
}

/**
 * Sends a WhatsApp notification (requires WhatsApp-enabled Twilio number).
 */
async function sendWhatsApp(to, message) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[WhatsApp mock] To: ${to} | Message: ${message}`);
    return;
  }
  try {
    await getClient().messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE}`,
      to: `whatsapp:${to}`,
    });
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

module.exports = { sendSMS, sendWhatsApp, notifyTurnNear };
