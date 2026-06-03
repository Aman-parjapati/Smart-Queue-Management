const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;

function initWhatsApp() {
  console.log('Initializing local WhatsApp Web client...');
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    console.log('\n======================================================================');
    console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP APP TO LINK AUTOMATED NOTIFICATIONS:');
    console.log('======================================================================\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    console.log('🚀 Local WhatsApp Web client is ready and logged in!');
  });

  client.on('auth_failure', (msg) => {
    console.error('WhatsApp Web authentication failure:', msg);
  });

  client.initialize().catch(err => {
    console.error('Error initializing WhatsApp Web:', err);
  });
}

function formatWhatsAppNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned; // Default to India country code if 10 digits
  }
  return `${cleaned}@c.us`;
}

async function sendLocalWhatsApp(to, message, mediaUrl = null) {
  if (!client || !isReady) {
    console.log(`[WhatsApp Local Mock] To: ${to} | Message: ${message} | MediaUrl: ${mediaUrl} (WhatsApp Web client not ready/logged in)`);
    return;
  }

  const chatId = formatWhatsAppNumber(to);
  try {
    if (mediaUrl) {
      const media = await MessageMedia.fromUrl(mediaUrl);
      await client.sendMessage(chatId, media, { caption: message });
    } else {
      await client.sendMessage(chatId, message);
    }
    console.log(`[WhatsApp Web] Message sent successfully to ${to}`);
  } catch (err) {
    console.error(`[WhatsApp Web] Error sending to ${to}:`, err.message);
  }
}

module.exports = { initWhatsApp, sendLocalWhatsApp };
