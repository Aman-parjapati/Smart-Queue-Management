package com.smartqueue.server.repository;

import com.smartqueue.server.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffRepository extends JpaRepository<Staff, UUID> {
    Optional<Staff> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Staff> findByBusinessIdOrderByCreatedAt(UUID businessId);
}
