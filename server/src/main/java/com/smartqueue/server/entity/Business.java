package com.smartqueue.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "businesses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Business {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    private String address;

    private String branch;

    @Column(name = "avg_service_time")
    @Builder.Default
    private Integer avgServiceTime = 10;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Transient
    private Boolean hasSlotsToday;
}
