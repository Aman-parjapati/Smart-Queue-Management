package com.smartqueue.server.repository;

import com.smartqueue.server.entity.QueueEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface QueueEventRepository extends JpaRepository<QueueEvent, UUID> {
    List<QueueEvent> findByBookingIdIn(List<UUID> bookingIds);
}
