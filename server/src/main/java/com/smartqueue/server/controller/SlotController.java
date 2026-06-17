package com.smartqueue.server.controller;

import com.smartqueue.server.entity.Booking;
import com.smartqueue.server.entity.Business;
import com.smartqueue.server.entity.Slot;
import com.smartqueue.server.repository.BookingRepository;
import com.smartqueue.server.repository.BusinessRepository;
import com.smartqueue.server.repository.SlotRepository;
import com.smartqueue.server.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final SlotRepository slotRepository;
    private final BusinessRepository businessRepository;
    private final BookingRepository bookingRepository;

    public SlotController(SlotRepository slotRepository,
                          BusinessRepository businessRepository,
                          BookingRepository bookingRepository) {
        this.slotRepository = slotRepository;
        this.businessRepository = businessRepository;
        this.bookingRepository = bookingRepository;
    }

    @Data
    public static class CreateSlotRequest {
        @NotNull(message = "business_id is required")
        private UUID business_id;
        @NotNull(message = "date is required")
        private LocalDate date;
        @NotNull(message = "start_time is required")
        private LocalTime start_time;
        @NotNull(message = "end_time is required")
        private LocalTime end_time;
        private Integer max_capacity;
        private Boolean entire_month;
    }

    @Data
    public static class UpdateSlotRequest {
        @NotNull(message = "start_time is required")
        private LocalTime start_time;
        @NotNull(message = "end_time is required")
        private LocalTime end_time;
        @NotNull(message = "max_capacity is required")
        private Integer max_capacity;
    }

    // Get slots for a business (optionally filter by date)
    @GetMapping("/business/{businessId}")
    public ResponseEntity<?> getBusinessSlots(@PathVariable UUID businessId,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Slot> slots;
        if (date != null) {
            slots = slotRepository.findByBusinessIdAndIsActiveTrueAndDateOrderByDateAscStartTimeAsc(businessId, date);
        } else {
            slots = slotRepository.findByBusinessIdAndIsActiveTrueOrderByDateAscStartTimeAsc(businessId);
        }
        return ResponseEntity.ok(slots);
    }

    // Create slot (admin/staff)
    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    public ResponseEntity<?> createSlot(@AuthenticationPrincipal UserPrincipal principal,
                                        @Valid @RequestBody CreateSlotRequest body) {
        // Staff can only create slots for their own business
        if ("staff".equals(principal.getRole()) && !body.getBusiness_id().equals(principal.getBusinessId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: staff cannot configure other businesses"));
        }

        // Admin can only create slots for businesses they own
        if ("admin".equals(principal.getRole())) {
            Optional<Business> biz = businessRepository.findById(body.getBusiness_id());
            if (biz.isEmpty() || !biz.get().getOwnerId().equals(principal.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied: you do not own this business"));
            }
        }

        if (body.getEntire_month() != null && body.getEntire_month()) {
            LocalDate startDate = body.getDate();
            LocalDate endDate = body.getDate().with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());
            List<Slot> createdSlots = new ArrayList<>();
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                boolean exists = slotRepository.existsByBusinessIdAndDateAndStartTimeAndEndTimeAndIsActiveTrue(
                        body.getBusiness_id(), date, body.getStart_time(), body.getEnd_time()
                );
                if (!exists) {
                    Slot slot = Slot.builder()
                            .businessId(body.getBusiness_id())
                            .date(date)
                            .startTime(body.getStart_time())
                            .endTime(body.getEnd_time())
                            .maxCapacity(body.getMax_capacity() != null ? body.getMax_capacity() : 20)
                            .build();
                    createdSlots.add(slot);
                }
            }
            if (createdSlots.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Slot already exists"));
            }
            slotRepository.saveAll(createdSlots);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Slots created successfully for the remainder of the month",
                    "count", createdSlots.size()
            ));
        }

        boolean exists = slotRepository.existsByBusinessIdAndDateAndStartTimeAndEndTimeAndIsActiveTrue(
                body.getBusiness_id(), body.getDate(), body.getStart_time(), body.getEnd_time()
        );
        if (exists) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Slot already exists"));
        }

        Slot slot = Slot.builder()
                .businessId(body.getBusiness_id())
                .date(body.getDate())
                .startTime(body.getStart_time())
                .endTime(body.getEnd_time())
                .maxCapacity(body.getMax_capacity() != null ? body.getMax_capacity() : 20)
                .build();

        slot = slotRepository.save(slot);
        return ResponseEntity.status(HttpStatus.CREATED).body(slot);
    }

    // Deactivate slot
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    public ResponseEntity<?> deactivateSlot(@AuthenticationPrincipal UserPrincipal principal,
                                            @PathVariable UUID id) {
        Optional<Slot> slotOpt = slotRepository.findById(id);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        if (!hasAccessToSlot(principal, slot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        slot.setIsActive(false);
        slot = slotRepository.save(slot);
        return ResponseEntity.ok(slot);
    }

    // Update slot details
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    public ResponseEntity<?> updateSlot(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable UUID id,
                                        @Valid @RequestBody UpdateSlotRequest body) {
        Optional<Slot> slotOpt = slotRepository.findById(id);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        if (!hasAccessToSlot(principal, slot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        slot.setStartTime(body.getStart_time());
        slot.setEndTime(body.getEnd_time());
        slot.setMaxCapacity(body.getMax_capacity());

        slot = slotRepository.save(slot);
        return ResponseEntity.ok(slot);
    }

    // Delete slot
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    public ResponseEntity<?> deleteSlot(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable UUID id) {
        Optional<Slot> slotOpt = slotRepository.findById(id);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        if (!hasAccessToSlot(principal, slot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        // Check if slot has active bookings
        List<Booking> bookings = bookingRepository.findBySlotIdOrderByTokenNumberAsc(id);
        if (!bookings.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Cannot delete a slot that already has bookings. Please cancel bookings first."));
        }

        slotRepository.delete(slot);
        return ResponseEntity.ok(Map.of("success", true, "message", "Slot deleted successfully"));
    }

    private boolean hasAccessToSlot(UserPrincipal principal, Slot slot) {
        if ("staff".equals(principal.getRole())) {
            return slot.getBusinessId().equals(principal.getBusinessId());
        } else if ("admin".equals(principal.getRole())) {
            Optional<Business> biz = businessRepository.findById(slot.getBusinessId());
            return biz.isPresent() && biz.get().getOwnerId().equals(principal.getId());
        }
        return false;
    }
}
