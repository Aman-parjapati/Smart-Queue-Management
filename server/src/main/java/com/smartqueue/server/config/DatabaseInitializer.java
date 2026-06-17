package com.smartqueue.server.config;

import com.smartqueue.server.entity.*;
import com.smartqueue.server.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final BusinessAdminRepository adminRepository;
    private final BusinessRepository businessRepository;
    private final StaffRepository staffRepository;
    private final SlotRepository slotRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(BusinessAdminRepository adminRepository,
                               BusinessRepository businessRepository,
                               StaffRepository staffRepository,
                               SlotRepository slotRepository,
                               PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.businessRepository = businessRepository;
        this.staffRepository = staffRepository;
        this.slotRepository = slotRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Only run seeder if there are no admins in the database
        if (adminRepository.count() > 0) {
            System.out.println("Database already contains data, skipping initialization.");
            return;
        }

        System.out.println("Initializing database with default demo data...");

        String defaultAdminPass = System.getenv("DEFAULT_ADMIN_PASSWORD");
        String defaultStaffPass = System.getenv("DEFAULT_STAFF_PASSWORD");
        
        boolean generatedAdminPass = false;
        boolean generatedStaffPass = false;
        
        if (defaultAdminPass == null || defaultAdminPass.trim().isEmpty()) {
            defaultAdminPass = generateRandomPassword();
            generatedAdminPass = true;
        }
        if (defaultStaffPass == null || defaultStaffPass.trim().isEmpty()) {
            defaultStaffPass = generateRandomPassword();
            generatedStaffPass = true;
        }

        // Encrypt default passwords
        String adminPasswordHash = passwordEncoder.encode(defaultAdminPass);
        String staffPasswordHash = passwordEncoder.encode(defaultStaffPass);

        if (generatedAdminPass) {
            System.out.println("==================================================");
            System.out.println("DEFAULT ADMIN PASSWORD SEEDED: " + defaultAdminPass);
            System.out.println("==================================================");
        }
        if (generatedStaffPass) {
            System.out.println("==================================================");
            System.out.println("DEFAULT STAFF PASSWORD SEEDED: " + defaultStaffPass);
            System.out.println("==================================================");
        }

        // 1. Create Admins
        BusinessAdmin admin1 = BusinessAdmin.builder()
                .name("Admin")
                .email("admin@smartqueue.com")
                .phone("9999999999")
                .passwordHash(adminPasswordHash)
                .build();

        BusinessAdmin admin2 = BusinessAdmin.builder()
                .name("Admin Gmail")
                .email("admin@gmail.com")
                .phone("+91 90000 11111")
                .passwordHash(adminPasswordHash)
                .build();

        BusinessAdmin admin3 = BusinessAdmin.builder()
                .name("Admin Smart")
                .email("admin@smart.com")
                .phone("+91 90000 22222")
                .passwordHash(adminPasswordHash)
                .build();

        adminRepository.saveAll(List.of(admin1, admin2, admin3));

        // 2. Create Businesses and their Staff
        LocalDate today = LocalDate.now();

        // Business 1: Vibrant Hair Salon
        Business biz1 = Business.builder()
                .ownerId(admin1.getId())
                .name("Vibrant Hair Salon")
                .category("salon")
                .address("Suite 202, Fashion Boulevard")
                .branch("West Side")
                .avgServiceTime(30)
                .build();
        biz1 = businessRepository.save(biz1);

        Staff staff1 = Staff.builder()
                .businessId(biz1.getId())
                .adminId(admin1.getId())
                .name("Priya Sharma")
                .email("priya@clinic.com")
                .phone("+91 90000 00000")
                .passwordHash(staffPasswordHash)
                .build();
        staffRepository.save(staff1);

        createDefaultSlots(biz1.getId(), today);

        // Business 2: City Dental Clinic
        Business biz2 = Business.builder()
                .ownerId(admin2.getId())
                .name("City Dental Clinic")
                .category("clinic")
                .address("101 Medical Plaza, Sector 15")
                .branch("Downtown Branch")
                .avgServiceTime(15)
                .build();
        biz2 = businessRepository.save(biz2);

        Staff staff2 = Staff.builder()
                .businessId(biz2.getId())
                .adminId(admin2.getId())
                .name("Veena")
                .email("veena@gmail.com")
                .phone("+91 9233654789")
                .passwordHash(staffPasswordHash)
                .build();
        staffRepository.save(staff2);

        createDefaultSlots(biz2.getId(), today);

        // Business 3: Apex Bank
        Business biz3 = Business.builder()
                .ownerId(admin3.getId())
                .name("Apex Bank")
                .category("bank")
                .address("Apex Towers, Financial District")
                .branch("City Center")
                .avgServiceTime(10)
                .build();
        biz3 = businessRepository.save(biz3);

        Staff staff3 = Staff.builder()
                .businessId(biz3.getId())
                .adminId(admin3.getId())
                .name("Rahul Kumar")
                .email("rahul@bank.com")
                .phone("+91 98888 77777")
                .passwordHash(staffPasswordHash)
                .build();
        staffRepository.save(staff3);

        createDefaultSlots(biz3.getId(), today);

        System.out.println("Database seeding completed successfully!");
    }

    private void createDefaultSlots(UUID businessId, LocalDate date) {
        Slot slot1 = Slot.builder()
                .businessId(businessId)
                .date(date)
                .startTime(LocalTime.of(9, 0, 0))
                .endTime(LocalTime.of(12, 0, 0))
                .maxCapacity(15)
                .bookedCount(0)
                .isActive(true)
                .build();

        Slot slot2 = Slot.builder()
                .businessId(businessId)
                .date(date)
                .startTime(LocalTime.of(13, 0, 0))
                .endTime(LocalTime.of(17, 0, 0))
                .maxCapacity(15)
                .bookedCount(0)
                .isActive(true)
                .build();

        slotRepository.saveAll(List.of(slot1, slot2));
    }
}
