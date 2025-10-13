package com.codespark.identityservice.config;

import com.webauthn4j.springframework.security.config.configurer.WebAuthnLoginConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class WebAuthnSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/login").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
            )
            .apply(WebAuthnLoginConfigurer.webAuthn())
                .rpId("localhost")
                .rpName("CodeSpark")
                .rpOrigins("http://localhost:8080");

        return http.build();
    }
}