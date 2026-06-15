package com.smartqueue.server.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUser;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private boolean isEmailConfigured() {
        return mailSender != null && mailHost != null && !mailHost.isBlank();
    }

    public void sendEmail(String to, String subject, String htmlContent) {
        if (!isEmailConfigured()) {
            log.info("[Email Mock] To: {} | Subject: {}", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            String from = mailUser != null && !mailUser.isBlank() ? mailUser : "onboarding@resend.dev";
            helper.setFrom(String.format("\"SmartQueue\" <%s>", from));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Error sending email to {}: {}", to, e.getMessage());
        }
    }

    public void sendBookingEmail(String to, String customerName, String bookingId, Integer tokenNumber,
                                 String businessName, LocalDate date, LocalTime startTime, LocalTime endTime) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        String timeStr = String.format("%s - %s", startTime.format(formatter), endTime.format(formatter));
        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + bookingId;
        String subject = String.format("Confirmed: Booking at %s (Token #%03d)", businessName, tokenNumber);
        
        String html = String.format("""
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
              <h2 style="color: #4f46e5; margin-bottom: 5px;">Your booking is confirmed!</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 0;">Thanks for using SmartQueue, %s.</p>
              
              <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Business:</strong> %s</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Date:</strong> %s</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Time:</strong> %s</p>
                <p style="margin: 0; font-size: 16px; color: #1e1b4b;"><strong>Token Number:</strong> <span style="font-size: 20px; color: #4f46e5; font-family: monospace; font-weight: bold;">#%03d</span></p>
              </div>
        
              <div style="text-align: center; margin-bottom: 20px;">
                <p style="font-size: 14px; color: #475569; margin-bottom: 10px;"><strong>Check-in QR Code:</strong></p>
                <img src="%s" alt="QR Code" style="border: 1px solid #cbd5e1; border-radius: 8px; width: 200px; height: 200px;" />
                <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Show this to staff when you arrive</p>
              </div>
        
              <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
                <a href="http://localhost:5173/token/%s" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">View Live Queue</a>
              </div>
            </div>
            """,
            customerName,
            businessName,
            date.toString(),
            timeStr,
            tokenNumber,
            qrUrl,
            bookingId
        );

        sendEmail(to, subject, html);
    }
}
