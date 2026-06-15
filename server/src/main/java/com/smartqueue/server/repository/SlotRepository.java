package com.smartqueue.server.repository;

import com.smartqueue.server.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {
    List<Slot> findByBusinessIdAndIsActiveTrueOrderByDateAscStartTimeAsc(UUID businessId);
    List<Slot> findByBusinessIdAndIsActiveTrueAndDateOrderByDateAscStartTimeAsc(UUID businessId, LocalDate date);
    List<Slot> findByDateAndIsActiveTrue(LocalDate date);
    List<Slot> findByBusinessIdAndDate(UUID businessId, LocalDate date);
}
