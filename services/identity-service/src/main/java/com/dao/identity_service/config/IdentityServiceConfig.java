package com.dao.identity_service.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Main configuration class for the identity service.
 * Enables configuration properties for the application.
 */
@Configuration
@EnableConfigurationProperties({
    JwtProperties.class
    // Add other properties classes here as needed
})
public class IdentityServiceConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
