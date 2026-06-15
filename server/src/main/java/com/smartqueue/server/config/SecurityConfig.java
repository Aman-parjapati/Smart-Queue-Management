package com.smartqueue.server.config;

import com.smartqueue.server.security.JwtFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final String clientUrl;

    public SecurityConfig(JwtFilter jwtFilter, @Value("${app.client.url}") String clientUrl) {
        this.jwtFilter = jwtFilter;
        this.clientUrl = clientUrl;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Round 12 to match bcrypt round count in Node.js
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public authentication and registry
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/login/admin", "/api/auth/login/staff", "/api/contact").permitAll()
                // Public businesses API
                .requestMatchers(HttpMethod.GET, "/api/businesses", "/api/businesses/*").permitAll()
                // Public slots API
                .requestMatchers(HttpMethod.GET, "/api/slots/business/**").permitAll()
                // Public queue and SSE API
                .requestMatchers(HttpMethod.GET, "/api/queue/live/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/queue/status/**").permitAll()
                // Public health check
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                // Static resources (for serving frontend bundle)
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/static/**", "/assets/**", "/favicon.ico").permitAll()
                // All other routes require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(clientUrl, "http://localhost:5173", "http://localhost:5000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
