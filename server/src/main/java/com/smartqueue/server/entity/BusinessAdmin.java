package com.smartqueue.server.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "business_admins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
