package com.smartqueue.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "staff")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "business_id", nullable = false)
    private UUID businessId;

    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
