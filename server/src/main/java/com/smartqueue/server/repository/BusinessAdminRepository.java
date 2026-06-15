package com.smartqueue.server.repository;

import com.smartqueue.server.entity.BusinessAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessAdminRepository extends JpaRepository<BusinessAdmin, UUID> {
    Optional<BusinessAdmin> findByEmail(String email);
    boolean existsByEmail(String email);
}
