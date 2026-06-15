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
import com.smartqueue.server.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final UserRepository userRepository;
    private final QueueEventRepository queueEventRepository;
    private final QrService qrService;
    private final QueueService queueService;
    private final SseService sseService;
    private final TwilioService twilioService;
    private final EmailService emailService;

    public BookingController(BookingRepository bookingRepository,
                             SlotRepository slotRepository,
                             UserRepository userRepository,
                             QueueEventRepository queueEventRepository,
                             QrService qrService,
                             QueueService queueService,
                             SseService sseService,
                             TwilioService twilioService,
                             EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.queueEventRepository = queueEventRepository;
        this.qrService = qrService;
        this.queueService = queueService;
        this.sseService = sseService;
        this.twilioService = twilioService;
        this.emailService = emailService;
    }

    @Data
    public static class CreateBookingRequest {
        @NotNull(message = "slot_id is required")
        private UUID slot_id;
    }

    @Data
    public static class CheckInRequest {
        @NotNull(message = "bookingId is required")
        private UUID bookingId;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@AuthenticationPrincipal UserPrincipal principal,
                                           @Valid @RequestBody CreateBookingRequest body) {
        UUID slotId = body.getSlot_id();
        UUID userId = principal.getId();

        Optional<Slot> slotOpt = slotRepository.findById(slotId);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        if (!slot.getIsActive()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Slot is not active"));
        }

        // Prevent booking slots in the past
        LocalDate today = LocalDate.now();
        if (slot.getDate().isBefore(today)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Slot date is in the past"));
        }
        if (slot.getDate().isEqual(today)) {
            LocalTime nowTime = LocalTime.now();
            if (slot.getEndTime().isBefore(nowTime)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Slot time is in the past"));
            }
        }

        if (slot.getBookedCount() >= slot.getMaxCapacity()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Slot is fully booked"));
        }

        // Check duplicate booking
        Optional<Booking> duplicateOpt = bookingRepository.findByUserIdAndSlotId(userId, slotId);
        if (duplicateOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "You already have a booking for this slot"));
        }

        int tokenNumber = slot.getBookedCount() + 1;

        // Create booking (without QR first)
        Booking booking = Booking.builder()
                .userId(userId)
                .slotId(slotId)
                .tokenNumber(tokenNumber)
                .status("pending")
                .qrCode("")
                .build();

        booking = bookingRepository.save(booking);

        // Generate QR code and update booking
        String qrCode = qrService.generateQRCode(booking.getId().toString());
        booking.setQrCode(qrCode);
        booking = bookingRepository.save(booking);

        // Increment booked_count on slot
        slot.setBookedCount(tokenNumber);
        slotRepository.save(slot);

        // Invalidate cache and broadcast live queue state
        queueService.invalidateCache(slotId);
        List<Booking> queueState = queueService.getQueueState(slotId);
        sseService.broadcastQueue(slot.getBusinessId(), slotId, Map.of("slotId", slotId, "queue", queueState));

        // Send confirmation asynchronously
        final UUID finalBookingId = booking.getId();
        final int finalTokenNumber = tokenNumber;
        final Slot finalSlot = slot;
        CompletableFuture.runAsync(() -> {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    String businessName = (finalSlot.getBusiness() != null) ? finalSlot.getBusiness().getName() : "Service Provider";
                    
                    if (user.getPhone() != null && !user.getPhone().isBlank()) {
                        twilioService.sendBookingConfirmation(
                                user.getPhone(),
                                finalBookingId.toString(),
                                finalTokenNumber,
                                businessName,
                                finalSlot.getDate(),
                                finalSlot.getStartTime(),
                                finalSlot.getEndTime()
                        );
                    }
                    if (user.getEmail() != null && !user.getEmail().isBlank()) {
                        emailService.sendBookingEmail(
                                user.getEmail(),
                                user.getName(),
                                finalBookingId.toString(),
                                finalTokenNumber,
                                businessName,
                                finalSlot.getDate(),
                                finalSlot.getStartTime(),
                                finalSlot.getEndTime()
                        );
                    }
                }
            } catch (Exception ex) {
                // Log and absorb notifications exceptions in background
                System.err.println("Failed to send booking notifications: " + ex.getMessage());
            }
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(@AuthenticationPrincipal UserPrincipal principal) {
        List<Booking> list = bookingRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable UUID id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Booking not found"));
        }

        Booking booking = bookingOpt.get();
        if ("customer".equals(principal.getRole()) && !booking.getUserId().equals(principal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        return ResponseEntity.ok(booking);
    }

    @PostMapping("/checkin")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Transactional
    public ResponseEntity<?> checkIn(@AuthenticationPrincipal UserPrincipal principal,
                                     @Valid @RequestBody CheckInRequest body) {
        Optional<Booking> bookingOpt = bookingRepository.findById(body.getBookingId());
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Booking not found"));
        }

        Booking booking = bookingOpt.get();
        if (!"pending".equals(booking.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Booking already checked in"));
        }

        booking.setStatus("arrived");
        booking = bookingRepository.save(booking);

        // Log queue event
        QueueEvent event = QueueEvent.builder()
                .bookingId(booking.getId())
                .eventType("arrived")
                .build();
        queueEventRepository.save(event);

        // Invalidate and broadcast
        UUID slotId = booking.getSlotId();
        queueService.invalidateCache(slotId);
        List<Booking> queueState = queueService.getQueueState(slotId);
        
        Optional<Slot> slotOpt = slotRepository.findById(slotId);
        if (slotOpt.isPresent()) {
            sseService.broadcastQueue(slotOpt.get().getBusinessId(), slotId, Map.of("slotId", slotId, "queue", queueState));
        }

        return ResponseEntity.ok(Map.of("success", true, "booking", booking));
    }
}
