package com.smartqueue.server.repository;

import com.smartqueue.server.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Booking> findByUserIdAndSlotId(UUID userId, UUID slotId);
    List<Booking> findBySlotIdOrderByTokenNumberAsc(UUID slotId);
    List<Booking> findBySlotIdIn(List<UUID> slotIds);
    Optional<Booking> findFirstBySlotIdAndStatusInOrderByTokenNumberAsc(UUID slotId, List<String> statuses);
    void deleteByUserId(UUID userId);
}
