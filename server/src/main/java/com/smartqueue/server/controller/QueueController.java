package com.smartqueue.server.controller;

import com.smartqueue.server.entity.Booking;
import com.smartqueue.server.entity.QueueEvent;
import com.smartqueue.server.entity.Slot;
import com.smartqueue.server.entity.User;
import com.smartqueue.server.repository.BookingRepository;
import com.smartqueue.server.repository.QueueEventRepository;
import com.smartqueue.server.repository.SlotRepository;
import com.smartqueue.server.repository.UserRepository;
import com.smartqueue.server.security.UserPrincipal;
import com.smartqueue.server.service.QueueService;
import com.smartqueue.server.service.SseService;
import com.smartqueue.server.service.TwilioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;
    private final SseService sseService;
    private final TwilioService twilioService;
    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final QueueEventRepository queueEventRepository;
    private final UserRepository userRepository;

    public QueueController(QueueService queueService,
                           SseService sseService,
                           TwilioService twilioService,
                           SlotRepository slotRepository,
                           BookingRepository bookingRepository,
                           QueueEventRepository queueEventRepository,
                           UserRepository userRepository) {
        this.queueService = queueService;
        this.sseService = sseService;
        this.twilioService = twilioService;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.queueEventRepository = queueEventRepository;
        this.userRepository = userRepository;
    }

    @Data
    public static class CallNextRequest {
        @NotNull(message = "slotId is required")
        private UUID slotId;
    }

    @Data
    public static class SkipTokenRequest {
        @NotNull(message = "bookingId is required")
        private UUID bookingId;
        @NotNull(message = "slotId is required")
        private UUID slotId;
    }

    @Data
    public static class CompleteServiceRequest {
        @NotNull(message = "bookingId is required")
        private UUID bookingId;
        @NotNull(message = "slotId is required")
        private UUID slotId;
    }

    // SSE Endpoint — no auth needed (public queue board)
    @GetMapping("/live/{businessId}")
    public SseEmitter liveQueue(@PathVariable UUID businessId,
                                @RequestParam(required = false) UUID slotId) {
        // Use a high timeout (e.g., 24 hours) to keep SSE connection alive
        SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L);
        String clientId = UUID.randomUUID().toString();

        sseService.addClient(businessId, clientId, emitter, slotId);

        try {
            UUID targetSlotId = slotId;
            if (targetSlotId == null) {
                // Get active slot for this business today
                List<Slot> slots = slotRepository.findByBusinessIdAndDate(businessId, LocalDate.now());
                Optional<Slot> activeSlot = slots.stream().filter(Slot::getIsActive).findFirst();
                if (activeSlot.isPresent()) {
                    targetSlotId = activeSlot.get().getId();
                }
            }

            if (targetSlotId != null) {
                List<Booking> queue = queueService.getQueueState(targetSlotId);
                emitter.send(SseEmitter.event().data(Map.of("slotId", targetSlotId, "queue", queue)));
            } else {
                emitter.send(SseEmitter.event().data(Map.of("slotId", "", "queue", Collections.emptyList())));
            }
        } catch (Exception e) {
            // Client closed early, removeClient will be called via onError/onCompletion
        }

        return emitter;
    }

    // Call Next Token
    @PostMapping("/next")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Transactional
    public ResponseEntity<?> callNext(@AuthenticationPrincipal UserPrincipal principal,
                                      @Valid @RequestBody CallNextRequest body) {
        UUID slotId = body.getSlotId();

        Optional<Slot> slotOpt = slotRepository.findById(slotId);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }
        Slot slot = slotOpt.get();

        // Enforce ownership checks
        if ("staff".equals(principal.getRole())) {
            if (principal.getBusinessId() == null || !principal.getBusinessId().equals(slot.getBusinessId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this slot does not belong to your business"));
            }
        } else if ("admin".equals(principal.getRole())) {
            if (slot.getBusiness() == null || !principal.getId().equals(slot.getBusiness().getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this slot does not belong to your business"));
            }
        }

        // Fetch current serving booking and mark as done
        List<Booking> bookings = bookingRepository.findBySlotIdOrderByTokenNumberAsc(slotId);
        for (Booking b : bookings) {
            if ("serving".equals(b.getStatus())) {
                b.setStatus("done");
                bookingRepository.save(b);
            }
        }

        // Insert done event
        QueueEvent doneEvent = QueueEvent.builder()
                .bookingId(null)
                .eventType("done")
                .build();
        queueEventRepository.save(doneEvent);

        // Fetch next pending/arrived
        Optional<Booking> nextOpt = queueService.getNextInQueue(slotId);
        if (nextOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "Queue is empty", "next", null));
        }

        Booking next = nextOpt.get();
        next.setStatus("serving");
        next = bookingRepository.save(next);

        // Insert serving event
        QueueEvent servingEvent = QueueEvent.builder()
                .bookingId(next.getId())
                .eventType("serving")
                .build();
        queueEventRepository.save(servingEvent);

        // Notify customer 2 tokens away
        final int currentTokenNum = next.getTokenNumber();
        List<Booking> queue = queueService.getQueueState(slotId);
        Optional<Booking> twoAwayOpt = queue.stream()
                .filter(b -> b.getTokenNumber() == currentTokenNum + 2)
                .findFirst();

        if (twoAwayOpt.isPresent()) {
            Booking twoAway = twoAwayOpt.get();
            Optional<User> userOpt = userRepository.findById(twoAway.getUserId());
            if (userOpt.isPresent() && userOpt.get().getPhone() != null && !userOpt.get().getPhone().isBlank()) {
                String businessName = slot.getBusiness() != null ?
                        slot.getBusiness().getName() : "the service";
                twilioService.notifyTurnNear(userOpt.get().getPhone(), twoAway.getTokenNumber(), businessName);
            }
        }

        queueService.invalidateCache(slotId);
        List<Booking> updatedQueue = queueService.getQueueState(slotId);

        // Broadcast update
        sseService.broadcastQueue(slot.getBusinessId(), slotId, Map.of("slotId", slotId, "queue", updatedQueue));

        return ResponseEntity.ok(Map.of("success", true, "serving", next, "queue", updatedQueue));
    }

    // Skip Token
    @PostMapping("/skip")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Transactional
    public ResponseEntity<?> skipToken(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody SkipTokenRequest body) {
        UUID bookingId = body.getBookingId();
        UUID slotId = body.getSlotId();

        Optional<Slot> slotOpt = slotRepository.findById(slotId);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }
        Slot slot = slotOpt.get();

        // Enforce ownership checks
        if ("staff".equals(principal.getRole())) {
            if (principal.getBusinessId() == null || !principal.getBusinessId().equals(slot.getBusinessId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this slot does not belong to your business"));
            }
        } else if ("admin".equals(principal.getRole())) {
            if (slot.getBusiness() == null || !principal.getId().equals(slot.getBusiness().getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this slot does not belong to your business"));
            }
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Booking not found"));
        }

        Booking booking = bookingOpt.get();
        if (!booking.getSlotId().equals(slotId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Booking does not belong to the specified slot"));
        }
        booking.setStatus("skipped");
        booking = bookingRepository.save(booking);

        QueueEvent skippedEvent = QueueEvent.builder()
                .bookingId(bookingId)
                .eventType("skipped")
                .build();
        queueEventRepository.save(skippedEvent);

        queueService.invalidateCache(slotId);
        List<Booking> queue = queueService.getQueueState(slotId);

        sseService.broadcastQueue(slot.getBusinessId(), slotId, Map.of("slotId", slotId, "queue", queue));

        return ResponseEntity.ok(Map.of("success", true, "booking", booking, "queue", queue));
    }

    // Complete Service
    @PostMapping("/complete")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Transactional
    public ResponseEntity<?> completeService(@AuthenticationPrincipal UserPrincipal principal,
                                             @Valid @RequestBody CompleteServiceRequest body) {
        UUID bookingId = body.getBookingId();
        UUID slotId = body.getSlotId();

        Optional<Slot> slotOpt = slotRepository.findById(slotId);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }
        Slot slot = slotOpt.get();

        // Enforce ownership checks
        if ("staff".equals(principal.getRole())) {
            if (principal.getBusinessId() == null || !principal.getBusinessId().equals(slot.getBusinessId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this slot does not belong to your business"));
            }
        } else if ("admin".equals(principal.getRole())) {
            if (slot.getBusiness() == null || !principal.getId().equals(slot.getBusiness().getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this slot does not belong to your business"));
            }
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty() || !"serving".equals(bookingOpt.get().getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Booking not found or not currently serving"));
        }

        Booking booking = bookingOpt.get();
        if (!booking.getSlotId().equals(slotId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Booking does not belong to the specified slot"));
        }
        booking.setStatus("done");
        booking = bookingRepository.save(booking);

        QueueEvent doneEvent = QueueEvent.builder()
                .bookingId(bookingId)
                .eventType("done")
                .build();
        queueEventRepository.save(doneEvent);

        queueService.invalidateCache(slotId);
        List<Booking> queue = queueService.getQueueState(slotId);

        sseService.broadcastQueue(slot.getBusinessId(), slotId, Map.of("slotId", slotId, "queue", queue));

        return ResponseEntity.ok(Map.of("success", true, "booking", booking, "queue", queue));
    }

    // Get Queue Status (REST fallback)
    @GetMapping("/status/{slotId}")
    public ResponseEntity<?> getQueueStatus(@PathVariable UUID slotId) {
        List<Booking> queue = queueService.getQueueState(slotId);

        Optional<Slot> slotOpt = slotRepository.findById(slotId);
        int avgTime = 10;
        if (slotOpt.isPresent() && slotOpt.get().getBusiness() != null) {
            avgTime = slotOpt.get().getBusiness().getAvgServiceTime();
        }

        List<Map<String, Object>> enriched = new ArrayList<>();
        int activePos = 1;
        for (Booking b : queue) {
            if (!"done".equals(b.getStatus())) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", b.getId());
                item.put("token_number", b.getTokenNumber());
                item.put("status", b.getStatus());
                item.put("user_id", b.getUserId());
                item.put("users", b.getUser());
                item.put("position", activePos);
                item.put("estimated_wait", queueService.calcWaitTime(activePos - 1, avgTime));
                enriched.add(item);
                activePos++;
            }
        }

        return ResponseEntity.ok(enriched);
    }
}
