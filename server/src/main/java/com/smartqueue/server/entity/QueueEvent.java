package com.smartqueue.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "queue_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "timestamp", insertable = false, updatable = false)
    private Instant timestamp;
}
