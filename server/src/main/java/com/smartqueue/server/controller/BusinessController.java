package com.smartqueue.server.controller;

import com.smartqueue.server.entity.Business;
import com.smartqueue.server.entity.Slot;
import com.smartqueue.server.repository.BusinessRepository;
import com.smartqueue.server.repository.SlotRepository;
import com.smartqueue.server.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/businesses")
public class BusinessController {

    private final BusinessRepository businessRepository;
    private final SlotRepository slotRepository;

    public BusinessController(BusinessRepository businessRepository, SlotRepository slotRepository) {
        this.businessRepository = businessRepository;
        this.slotRepository = slotRepository;
    }

    @Data
    public static class BusinessRequest {
        @NotBlank(message = "name is required")
        private String name;
        @NotBlank(message = "category is required")
        private String category;
        private String address;
        private String branch;
        private Integer avgServiceTime;
    }

    // List all businesses (public)
    @GetMapping
    public ResponseEntity<?> listBusinesses() {
        List<Business> businesses = businessRepository.findAllByOrderByNameAsc();
        LocalDate today = LocalDate.now();

        List<Slot> todaySlots = slotRepository.findByDateAndIsActiveTrue(today);
        Set<UUID> activeBizIds = todaySlots.stream()
                .map(Slot::getBusinessId)
                .collect(Collectors.toSet());

        for (Business b : businesses) {
            b.setHasSlotsToday(activeBizIds.contains(b.getId()));
        }

        return ResponseEntity.ok(businesses);
    }

    // Get single business
    @GetMapping("/{id}")
    public ResponseEntity<?> getBusiness(@PathVariable UUID id) {
        Optional<Business> biz = businessRepository.findById(id);
        if (biz.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Business not found"));
        }
        return ResponseEntity.ok(biz.get());
    }

    // Create business (admin only)
    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> createBusiness(@AuthenticationPrincipal UserPrincipal principal,
                                            @Valid @RequestBody BusinessRequest body) {
        Business biz = Business.builder()
                .ownerId(principal.getId())
                .name(body.getName())
                .category(body.getCategory())
                .address(body.getAddress())
                .branch(body.getBranch())
                .avgServiceTime(body.getAvgServiceTime() != null ? body.getAvgServiceTime() : 10)
                .build();

        biz = businessRepository.save(biz);
        return ResponseEntity.status(HttpStatus.CREATED).body(biz);
    }

    // Update business
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> updateBusiness(@AuthenticationPrincipal UserPrincipal principal,
                                            @PathVariable UUID id,
                                            @Valid @RequestBody BusinessRequest body) {
        Optional<Business> bizOpt = businessRepository.findById(id);
        if (bizOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Business not found"));
        }

        Business biz = bizOpt.get();
        if (!biz.getOwnerId().equals(principal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied"));
        }

        biz.setName(body.getName());
        biz.setCategory(body.getCategory());
        biz.setAddress(body.getAddress());
        biz.setBranch(body.getBranch());
        if (body.getAvgServiceTime() != null) {
            biz.setAvgServiceTime(body.getAvgServiceTime());
        }

        biz = businessRepository.save(biz);
        return ResponseEntity.ok(biz);
    }
}
