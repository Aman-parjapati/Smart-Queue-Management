package com.smartqueue.server.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class TwilioService {

    private final String accountSid;
    private final String authToken;
    private final String twilioPhone;
    private final boolean enableLocalWhatsapp;

    public TwilioService(
            @Value("${twilio.account.sid}") String accountSid,
            @Value("${twilio.auth.token}") String authToken,
            @Value("${twilio.phone}") String twilioPhone,
            @Value("${app.enable-local-whatsapp}") boolean enableLocalWhatsapp) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.twilioPhone = twilioPhone;
        this.enableLocalWhatsapp = enableLocalWhatsapp;

        if (isTwilioConfigured()) {
            Twilio.init(accountSid, authToken);
        }
    }

    private boolean isTwilioConfigured() {
        return accountSid != null && !accountSid.isBlank() && authToken != null && !authToken.isBlank();
    }

    public void sendSMS(String to, String message, String mediaUrl) {
        if (!isTwilioConfigured()) {
            log.info("[SMS Mock] To: {} | Message: {} | MediaUrl: {}", to, message, mediaUrl);
            return;
        }
        try {
            var messageBuilder = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(twilioPhone),
                    message
            );
            if (mediaUrl != null && !mediaUrl.isBlank()) {
                messageBuilder.setMediaUrl(Collections.singletonList(URI.create(mediaUrl)));
            }
            messageBuilder.create();
            log.info("SMS sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Twilio SMS error: {}", e.getMessage());
        }
    }

    public void sendWhatsApp(String to, String message, String mediaUrl) {
        if (enableLocalWhatsapp) {
            log.info("[WhatsApp Local Mock] To: {} | Message: {} | MediaUrl: {}", to, message, mediaUrl);
            return;
        }

        if (!isTwilioConfigured()) {
            log.info("[WhatsApp Mock] To: {} | Message: {} | MediaUrl: {}", to, message, mediaUrl);
            return;
        }

        try {
            var messageBuilder = Message.creator(
                    new PhoneNumber("whatsapp:" + to),
                    new PhoneNumber("whatsapp:" + twilioPhone),
                    message
            );
            if (mediaUrl != null && !mediaUrl.isBlank()) {
                messageBuilder.setMediaUrl(Collections.singletonList(URI.create(mediaUrl)));
            }
            messageBuilder.create();
            log.info("WhatsApp sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Twilio WhatsApp error: {}", e.getMessage());
        }
    }

    public void notifyTurnNear(String phone, Integer tokenNumber, String businessName) {
        String msg = String.format("🔔 SmartQueue Alert: Your token #%d at %s is coming up soon! Please be ready.", tokenNumber, businessName);
        sendSMS(phone, msg, null);
    }

    public void sendBookingConfirmation(String phone, String bookingId, Integer tokenNumber, String businessName, LocalDate date, LocalTime startTime, LocalTime endTime) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        String timeStr = String.format("%s - %s", startTime.format(formatter), endTime.format(formatter));
        String msg = String.format(
                "🎉 SmartQueue Confirmation: Your booking is confirmed at %s!\n\n📅 Date: %s\n⏰ Time: %s\n🎫 Token: #%03d\n🆔 Booking ID: %s\n\nHere is your check-in QR code.",
                businessName,
                date.toString(),
                timeStr,
                tokenNumber,
                bookingId
        );

        String mediaUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + bookingId;

        // Send to SMS
        sendSMS(phone, msg, mediaUrl);

        // Send to WhatsApp
        sendWhatsApp(phone, msg, mediaUrl);
    }
}
