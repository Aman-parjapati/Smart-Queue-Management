package com.smartqueue.server.controller;

import com.smartqueue.server.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final EmailService emailService;
    private final String inquiryEmail;

    public ContactController(EmailService emailService,
                             @Value("${app.contact.inquiry-email}") String inquiryEmail) {
        this.emailService = emailService;
        this.inquiryEmail = inquiryEmail;
    }

    @Data
    public static class ContactRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Mobile number is required")
        private String phone;

        private String plan;
        
        @NotBlank(message = "Description is required")
        private String description;
    }

    @PostMapping
    public ResponseEntity<?> submitInquiry(@Valid @RequestBody ContactRequest body) {
        String emailBody = String.format("""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
              <h2 style="color: #4f46e5; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">New Pricing Inquiry</h2>
              
              <table style="width: 100%%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #475569; font-weight: bold; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #1e293b;">%s</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #475569; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:%s">%s</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #475569; font-weight: bold;">Mobile:</td>
                  <td style="padding: 8px 0; color: #1e293b;">%s</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #475569; font-weight: bold;">Selected Plan:</td>
                  <td style="padding: 8px 0; color: #1e293b;"><span style="background-color: #e0e7ff; color: #4338ca; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 13px;">%s</span></td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding: 8px 0; color: #475569; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #1e293b; white-space: pre-wrap; line-height: 1.5;">%s</td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center;">
                SmartQueue Inquiry Management System — Received on %s
              </div>
            </div>
            """,
            body.getName(),
            body.getEmail(),
            body.getEmail(),
            body.getPhone(),
            body.getPlan() != null ? body.getPlan() : "General/Unknown",
            body.getDescription(),
            new java.util.Date().toString()
        );

        emailService.sendEmail(inquiryEmail, "New Inquiry for " + body.getPlan(), emailBody);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Our executive will contact you shortly"
        ));
    }
}
