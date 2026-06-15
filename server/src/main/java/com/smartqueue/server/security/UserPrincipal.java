package com.smartqueue.server.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String role;
    private final String table;
    private final UUID businessId;

    public UserPrincipal(UUID id, String email, String role, String table, UUID businessId) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.table = table;
        this.businessId = businessId;
    }

    public UUID getId() {
        return id;
    }

    public String getRole() {
        return role;
    }

    public String getTable() {
        return table;
    }

    public UUID getBusinessId() {
        return businessId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return null; // Stateless JWT login has no password verification here
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
