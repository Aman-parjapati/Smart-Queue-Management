package com.smartqueue.server.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class QrService {

    /**
     * Generates a base64 PNG QR code for a booking ID.
     */
    public String generateQRCode(String bookingId) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(bookingId, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();

            String base64String = Base64.getEncoder().encodeToString(pngData);
            return "data:image/png;base64," + base64String;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR Code", e);
        }
    }
}
