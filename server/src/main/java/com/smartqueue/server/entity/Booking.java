package com.smartqueue.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonProperty("users")
    private User user;

    @Column(name = "slot_id", nullable = false)
    private UUID slotId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "slot_id", insertable = false, updatable = false)
    @JsonProperty("slots")
    private Slot slot;

    @Column(name = "token_number", nullable = false)
    private Integer tokenNumber;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
