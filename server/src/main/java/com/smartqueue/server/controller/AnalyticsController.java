package com.smartqueue.server.controller;

import com.smartqueue.server.entity.Booking;
import com.smartqueue.server.entity.QueueEvent;
import com.smartqueue.server.entity.Slot;
import com.smartqueue.server.repository.BookingRepository;
import com.smartqueue.server.repository.QueueEventRepository;
import com.smartqueue.server.repository.SlotRepository;
import com.smartqueue.server.security.UserPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final QueueEventRepository queueEventRepository;

    public AnalyticsController(SlotRepository slotRepository,
                               BookingRepository bookingRepository,
                               QueueEventRepository queueEventRepository) {
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.queueEventRepository = queueEventRepository;
    }

    @GetMapping("/{businessId}")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable UUID businessId,
                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();

        // Get slots on date
        List<Slot> slots = slotRepository.findByBusinessIdAndDate(businessId, targetDate);
        if (slots.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "slots", Collections.emptyList(),
                    "summary", Collections.emptyMap(),
                    "hourCounts", Collections.emptyMap()
            ));
        }

        List<UUID> slotIds = slots.stream().map(Slot::getId).collect(Collectors.toList());

        // Fetch bookings for these slots
        List<Booking> bookings = bookingRepository.findBySlotIdIn(slotIds);

        // Count statuses
        long total = bookings.size();
        long done = bookings.stream().filter(b -> "done".equals(b.getStatus())).count();
        long serving = bookings.stream().filter(b -> "serving".equals(b.getStatus())).count();
        long pending = bookings.stream().filter(b -> "pending".equals(b.getStatus())).count();
        long skipped = bookings.stream().filter(b -> "skipped".equals(b.getStatus())).count();
        long arrived = bookings.stream().filter(b -> "arrived".equals(b.getStatus())).count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", total);
        summary.put("done", done);
        summary.put("serving", serving);
        summary.put("pending", pending);
        summary.put("skipped", skipped);
        summary.put("arrived", arrived);

        // Peak hour analysis
        List<UUID> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());
        Map<Integer, Integer> hourCounts = new HashMap<>();

        if (!bookingIds.isEmpty()) {
            List<QueueEvent> events = queueEventRepository.findByBookingIdIn(bookingIds);
            for (QueueEvent e : events) {
                if (e.getTimestamp() != null) {
                    // Extract hour in local timezone
                    int hour = e.getTimestamp().atZone(ZoneId.systemDefault()).getHour();
                    hourCounts.put(hour, hourCounts.getOrDefault(hour, 0) + 1);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("slots", slots);
        response.put("summary", summary);
        response.put("hourCounts", hourCounts);

        return ResponseEntity.ok(response);
    }
}
