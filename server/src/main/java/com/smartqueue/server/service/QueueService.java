package com.smartqueue.server.service;

import com.smartqueue.server.entity.Booking;
import com.smartqueue.server.repository.BookingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class QueueService {

    private final BookingRepository bookingRepository;

    // A lightweight local cache to mimic the Express 10s Redis caching
    private final Map<UUID, CacheEntry> localCache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final List<Booking> data;
        final Instant expiry;

        CacheEntry(List<Booking> data, Instant expiry) {
            this.data = data;
            this.expiry = expiry;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiry);
        }
    }

    public QueueService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    /**
     * Returns all bookings for a slot, ordered by token_number.
     * Caches state locally for 10 seconds (Express style).
     */
    public List<Booking> getQueueState(UUID slotId) {
        CacheEntry entry = localCache.get(slotId);
        if (entry != null && !entry.isExpired()) {
            return entry.data;
        }

        List<Booking> bookings = bookingRepository.findBySlotIdOrderByTokenNumberAsc(slotId);
        localCache.put(slotId, new CacheEntry(bookings, Instant.now().plusSeconds(10)));
        return bookings;
    }

    /**
     * Invalidates cache.
     */
    public void invalidateCache(UUID slotId) {
        localCache.remove(slotId);
    }

    /**
     * Calculates estimated wait time for a given token position.
     */
    public int calcWaitTime(int position, int avgServiceTime) {
        if (position <= 0) return 0;
        return position * avgServiceTime;
    }

    /**
     * Returns the next pending/arrived booking in line.
     */
    public Optional<Booking> getNextInQueue(UUID slotId) {
        return bookingRepository.findFirstBySlotIdAndStatusInOrderByTokenNumberAsc(
                slotId, List.of("pending", "arrived")
        );
    }
}
