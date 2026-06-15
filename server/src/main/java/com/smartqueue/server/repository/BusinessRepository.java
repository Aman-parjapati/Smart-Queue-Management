package com.smartqueue.server.repository;

import com.smartqueue.server.entity.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessRepository extends JpaRepository<Business, UUID> {
    List<Business> findAllByOrderByNameAsc();
    Optional<Business> findByOwnerId(UUID ownerId);
}
