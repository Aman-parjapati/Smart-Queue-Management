package com.smartqueue.server.security;

import com.smartqueue.server.repository.BusinessAdminRepository;
import com.smartqueue.server.repository.StaffRepository;
import com.smartqueue.server.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final BusinessAdminRepository businessAdminRepository;
    private final StaffRepository staffRepository;

    public JwtFilter(JwtService jwtService,
                     UserRepository userRepository,
                     BusinessAdminRepository businessAdminRepository,
                     StaffRepository staffRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.businessAdminRepository = businessAdminRepository;
        this.staffRepository = staffRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = jwtService.extractAllClaims(token);

            if (jwtService.isTokenExpired(claims)) {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
                return;
            }

            UUID id = UUID.fromString(claims.get("id", String.class));
            String email = claims.get("email", String.class);
            String role = claims.get("role", String.class);
            String table = claims.get("table", String.class);
            String businessIdStr = claims.get("business_id", String.class);
            UUID businessId = (businessIdStr != null) ? UUID.fromString(businessIdStr) : null;

            // Verify user still exists in database (matching Express check)
            boolean userExists = false;
            if ("users".equals(table)) {
                userExists = userRepository.existsById(id);
            } else if ("business_admins".equals(table)) {
                userExists = businessAdminRepository.existsById(id);
            } else if ("staff".equals(table)) {
                userExists = staffRepository.existsById(id);
            }

            if (!userExists) {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Session expired or user deleted");
                return;
            }

            UserPrincipal principal = new UserPrincipal(id, email, role, table, businessId);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(String.format("{\"error\": \"%s\"}", message));
    }
}
