package com.smartqueue.server.controller;

import com.smartqueue.server.entity.Business;
import com.smartqueue.server.entity.BusinessAdmin;
import com.smartqueue.server.entity.Staff;
import com.smartqueue.server.entity.User;
import com.smartqueue.server.repository.BookingRepository;
import com.smartqueue.server.repository.BusinessAdminRepository;
import com.smartqueue.server.repository.BusinessRepository;
import com.smartqueue.server.repository.StaffRepository;
import com.smartqueue.server.repository.UserRepository;
import com.smartqueue.server.security.JwtService;
import com.smartqueue.server.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final BusinessAdminRepository businessAdminRepository;
    private final StaffRepository staffRepository;
    private final BusinessRepository businessRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          BusinessAdminRepository businessAdminRepository,
                          StaffRepository staffRepository,
                          BusinessRepository businessRepository,
                          BookingRepository bookingRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.businessAdminRepository = businessAdminRepository;
        this.staffRepository = staffRepository;
        this.businessRepository = businessRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // ── DTOs ──────────────────────────────────────────────────────
    @Data
    public static class RegisterRequest {
        @NotBlank(message = "name is required")
        private String name;
        @NotBlank(message = "email is required")
        @Email
        private String email;
        private String phone;
        @NotBlank(message = "password is required")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "email is required")
        @Email
        private String email;
        @NotBlank(message = "password is required")
        private String password;
    }

    @Data
    public static class ProfileUpdateRequest {
        private String name;
        private String email;
        private String phone;
        private String password;
    }

    @Data
    public static class CreateStaffRequest {
        @NotBlank(message = "name is required")
        private String name;
        @NotBlank(message = "email is required")
        @Email
        private String email;
        private String phone;
        @NotBlank(message = "password is required")
        private String password;
    }

    // ── CUSTOMER register / login ────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest body) {
        if (userRepository.existsByEmail(body.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }

        User user = User.builder()
                .name(body.getName())
                .email(body.getEmail())
                .phone(body.getPhone())
                .passwordHash(passwordEncoder.encode(body.getPassword()))
                .role("customer")
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getId(), user.getEmail(), "customer", "users", null);

        Map<String, Object> response = new HashMap<>();
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", "customer"
        ));
        response.put("token", token);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginCustomer(@Valid @RequestBody LoginRequest body) {
        Optional<User> userOpt = userRepository.findByEmail(body.getEmail());
        if (userOpt.isEmpty() || !passwordEncoder.matches(body.getPassword(), userOpt.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        String token = jwtService.generateToken(user.getId(), user.getEmail(), "customer", "users", null);

        Map<String, Object> response = new HashMap<>();
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", "customer"
        ));
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    // ── ADMIN login ──────────────────────────────────────────────
    @PostMapping("/login/admin")
    public ResponseEntity<?> loginAdmin(@Valid @RequestBody LoginRequest body) {
        Optional<BusinessAdmin> adminOpt = businessAdminRepository.findByEmail(body.getEmail());
        if (adminOpt.isEmpty() || !passwordEncoder.matches(body.getPassword(), adminOpt.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        BusinessAdmin admin = adminOpt.get();
        String token = jwtService.generateToken(admin.getId(), admin.getEmail(), "admin", "business_admins", null);

        Map<String, Object> response = new HashMap<>();
        response.put("user", Map.of(
                "id", admin.getId(),
                "name", admin.getName(),
                "email", admin.getEmail(),
                "phone", admin.getPhone() != null ? admin.getPhone() : "",
                "role", "admin"
        ));
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    // ── STAFF login ──────────────────────────────────────────────
    @PostMapping("/login/staff")
    public ResponseEntity<?> loginStaff(@Valid @RequestBody LoginRequest body) {
        Optional<Staff> staffOpt = staffRepository.findByEmail(body.getEmail());
        if (staffOpt.isEmpty() || !passwordEncoder.matches(body.getPassword(), staffOpt.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        Staff staff = staffOpt.get();
        String token = jwtService.generateToken(staff.getId(), staff.getEmail(), "staff", "staff", staff.getBusinessId());

        Map<String, Object> response = new HashMap<>();
        response.put("user", Map.of(
                "id", staff.getId(),
                "name", staff.getName(),
                "email", staff.getEmail(),
                "phone", staff.getPhone() != null ? staff.getPhone() : "",
                "role", "staff",
                "business_id", staff.getBusinessId()
        ));
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    // ── /me — works for all three tables ─────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        String table = principal.getTable();
        UUID id = principal.getId();

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", id);
        userMap.put("role", principal.getRole());

        if ("users".equals(table)) {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            userMap.put("name", user.getName());
            userMap.put("email", user.getEmail());
            userMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
        } else if ("business_admins".equals(table)) {
            BusinessAdmin admin = businessAdminRepository.findById(id).orElse(null);
            if (admin == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            userMap.put("name", admin.getName());
            userMap.put("email", admin.getEmail());
            userMap.put("phone", admin.getPhone() != null ? admin.getPhone() : "");
        } else if ("staff".equals(table)) {
            Staff staff = staffRepository.findById(id).orElse(null);
            if (staff == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            userMap.put("name", staff.getName());
            userMap.put("email", staff.getEmail());
            userMap.put("phone", staff.getPhone() != null ? staff.getPhone() : "");
            userMap.put("business_id", staff.getBusinessId());
        }

        return ResponseEntity.ok(userMap);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                           @RequestBody ProfileUpdateRequest body) {
        UUID id = principal.getId();
        String role = principal.getRole();
        String table = principal.getTable();

        try {
            Map<String, Object> updatedUser = new HashMap<>();
            updatedUser.put("id", id);
            updatedUser.put("role", role);

            if ("users".equals(table)) {
                User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
                if (body.getName() != null) user.setName(body.getName());
                if (body.getPhone() != null) user.setPhone(body.getPhone());
                if (body.getEmail() != null) {
                    Optional<User> existing = userRepository.findByEmail(body.getEmail());
                    if (existing.isPresent() && !existing.get().getId().equals(id)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
                    }
                    user.setEmail(body.getEmail());
                }
                userRepository.save(user);

                updatedUser.put("name", user.getName());
                updatedUser.put("email", user.getEmail());
                updatedUser.put("phone", user.getPhone() != null ? user.getPhone() : "");

            } else if ("business_admins".equals(table)) {
                BusinessAdmin admin = businessAdminRepository.findById(id).orElseThrow(() -> new RuntimeException("Admin not found"));
                if (body.getPhone() != null) admin.setPhone(body.getPhone());
                if (body.getPassword() != null && !body.getPassword().isBlank()) {
                    admin.setPasswordHash(passwordEncoder.encode(body.getPassword()));
                }
                businessAdminRepository.save(admin);

                updatedUser.put("name", admin.getName());
                updatedUser.put("email", admin.getEmail());
                updatedUser.put("phone", admin.getPhone() != null ? admin.getPhone() : "");

            } else if ("staff".equals(table)) {
                Staff staff = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Staff not found"));
                if (body.getPhone() != null) staff.setPhone(body.getPhone());
                if (body.getPassword() != null && !body.getPassword().isBlank()) {
                    staff.setPasswordHash(passwordEncoder.encode(body.getPassword()));
                }
                staffRepository.save(staff);

                updatedUser.put("name", staff.getName());
                updatedUser.put("email", staff.getEmail());
                updatedUser.put("phone", staff.getPhone() != null ? staff.getPhone() : "");
                updatedUser.put("business_id", staff.getBusinessId());
            }

            return ResponseEntity.ok(Map.of("success", true, "user", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/profile")
    @Transactional
    public ResponseEntity<?> deleteProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (!"customer".equals(principal.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only customers can delete their account"));
        }

        try {
            UUID userId = principal.getId();
            // Delete bookings first (foreign key constraint)
            bookingRepository.deleteByUserId(userId);
            // Delete user
            userRepository.deleteById(userId);

            return ResponseEntity.ok(Map.of("success", true, "message", "Account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Admin-only staff management ─────────────────────────────
    @PostMapping("/staff")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> createStaff(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody CreateStaffRequest body) {
        Optional<Business> bizOpt = businessRepository.findByOwnerId(principal.getId());
        if (bizOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "No business found for this admin"));
        }

        if (staffRepository.existsByEmail(body.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already in use"));
        }

        Business biz = bizOpt.get();
        Staff staff = Staff.builder()
                .name(body.getName())
                .email(body.getEmail())
                .phone(body.getPhone())
                .passwordHash(passwordEncoder.encode(body.getPassword()))
                .businessId(biz.getId())
                .adminId(principal.getId())
                .build();

        staff = staffRepository.save(staff);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", staff.getId(),
                "name", staff.getName(),
                "email", staff.getEmail(),
                "phone", staff.getPhone() != null ? staff.getPhone() : "",
                "business_id", staff.getBusinessId()
        ));
    }

    @GetMapping("/staff")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> listStaff(@AuthenticationPrincipal UserPrincipal principal) {
        Optional<Business> bizOpt = businessRepository.findByOwnerId(principal.getId());
        if (bizOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Staff> staffList = staffRepository.findByBusinessIdOrderByCreatedAt(bizOpt.get().getId());
        List<Map<String, Object>> response = new ArrayList<>();
        for (Staff s : staffList) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("email", s.getEmail());
            map.put("phone", s.getPhone() != null ? s.getPhone() : "");
            map.put("created_at", s.getCreatedAt());
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/staff/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> deleteStaff(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable UUID id) {
        Optional<Business> bizOpt = businessRepository.findByOwnerId(principal.getId());
        if (bizOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "No business found"));
        }

        Optional<Staff> staffOpt = staffRepository.findById(id);
        if (staffOpt.isEmpty() || !staffOpt.get().getBusinessId().equals(bizOpt.get().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied"));
        }

        staffRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
