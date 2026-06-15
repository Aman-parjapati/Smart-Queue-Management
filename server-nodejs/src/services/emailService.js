const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

async function sendEmail(to, subject, html) {
  const client = getTransporter();
  if (!client) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await client.sendMail({
      from: process.env.SMTP_FROM || '"SmartQueue" <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (err) {
    console.error('Error sending email:', err.message);
  }
}

async function sendBookingEmail(to, customerName, bookingId, tokenNumber, businessName, date, startTime, endTime) {
  const timeStr = `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${bookingId}`;
  
  const subject = `Confirmed: Booking at ${businessName} (Token #${String(tokenNumber).padStart(3, '0')})`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
      <h2 style="color: #4f46e5; margin-bottom: 5px;">Your booking is confirmed!</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 0;">Thanks for using SmartQueue, ${customerName}.</p>
      
      <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Business:</strong> ${businessName}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Time:</strong> ${timeStr}</p>
        <p style="margin: 0; font-size: 16px; color: #1e1b4b;"><strong>Token Number:</strong> <span style="font-size: 20px; color: #4f46e5; font-family: monospace; font-weight: bold;">#${String(tokenNumber).padStart(3, '0')}</span></p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <p style="font-size: 14px; color: #475569; margin-bottom: 10px;"><strong>Check-in QR Code:</strong></p>
        <img src="${qrUrl}" alt="QR Code" style="border: 1px solid #cbd5e1; border-radius: 8px; width: 200px; height: 200px;" />
        <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Show this to staff when you arrive</p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/token/${bookingId}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">View Live Queue</a>
      </div>
    </div>
  `;

  await sendEmail(to, subject, html);
}

module.exports = { sendBookingEmail };
