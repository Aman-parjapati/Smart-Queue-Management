package com.smartqueue.server.repository;

import com.smartqueue.server.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {
    List<Slot> findByBusinessIdAndIsActiveTrueOrderByDateAscStartTimeAsc(UUID businessId);
    List<Slot> findByBusinessIdAndIsActiveTrueAndDateOrderByDateAscStartTimeAsc(UUID businessId, LocalDate date);
    List<Slot> findByDateAndIsActiveTrue(LocalDate date);
    List<Slot> findByBusinessIdAndDate(UUID businessId, LocalDate date);
    boolean existsByBusinessIdAndDateAndStartTimeAndEndTimeAndIsActiveTrue(UUID businessId, LocalDate date, java.time.LocalTime startTime, java.time.LocalTime endTime);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from Slot s where s.id = :id")
    Optional<Slot> findByIdWithLock(@org.springframework.data.repository.query.Param("id") UUID id);
}
