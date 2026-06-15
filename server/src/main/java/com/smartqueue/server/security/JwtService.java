package com.smartqueue.server.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;

    public JwtService(@Value("${app.jwt.secret}") String secret) {
        // Ensure secret key is long enough for HS256 (256 bits / 32 bytes)
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(UUID id, String email, String role, String table, UUID businessId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", id.toString());
        claims.put("email", email);
        claims.put("role", role);
        claims.put("table", table);
        if (businessId != null) {
            claims.put("business_id", businessId.toString());
        }

        long expirationMs = 7L * 24 * 60 * 60 * 1000; // 7 days in ms
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }
}
