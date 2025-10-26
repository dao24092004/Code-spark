package com.dao.identity_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;

/**
 * Configuration properties for JWT token generation and validation.
 * Properties are loaded from application.properties/yml with prefix 'app.jwt'.
 */
@Data
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    
    /**
     * Secret key used for signing JWT tokens.
     * Should be a secure, random string with sufficient length.
     */
    @NotBlank(message = "JWT secret key must not be blank")
    private String secret;
    
    /**
     * Expiration time for access tokens in milliseconds.
     * Default: 24 hours
     */
    @Positive(message = "Expiration time must be a positive number")
    private long expirationMs = 86400000; // 24 hours
    
    /**
     * Expiration time for refresh tokens in milliseconds.
     * Default: 7 days
     */
    @Positive(message = "Refresh expiration time must be a positive number")
    private long refreshExpirationMs = 604800000; // 7 days
    
    /**
     * Issuer claim for JWT tokens.
     */
    @NotBlank(message = "Issuer must not be blank")
    private String issuer = "identity-service";
    
    /**
     * Audience claim for JWT tokens.
     */
    @NotBlank(message = "Audience must not be blank")
    private String audience = "code-spark-app";
}
