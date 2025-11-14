package com.dao.analyticsservice.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable()) // Disable CORS - API Gateway handles it
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()
            );
        return http.build();
    }

    // CORS is handled by API Gateway
    // @Bean
    // public CorsConfigurationSource corsConfigurationSource() {
    //     CorsConfiguration configuration = new CorsConfiguration();
    //     
    //     // Cho phép các origin từ frontend
    //     configuration.setAllowedOrigins(Arrays.asList(
    //         "http://localhost:3000",
    //         "http://localhost:4173",
    //         "http://localhost:5173",
    //         "http://localhost:8080"
    //     ));
    //     
    //     // Cho phép tất cả các HTTP methods
    //     configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    //     
    //     // Cho phép tất cả các headers
    //     configuration.setAllowedHeaders(Arrays.asList("*"));
    //     
    //     // Cho phép gửi credentials (cookies, authorization headers)
    //     configuration.setAllowCredentials(true);
    //     
    //     // Expose các headers để frontend có thể đọc
    //     configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
    //     
    //     // Cache preflight request trong 1 giờ
    //     configuration.setMaxAge(3600L);
    //     
    //     UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    //     source.registerCorsConfiguration("/**", configuration);
    //     
    //     return source;
    // }
}
