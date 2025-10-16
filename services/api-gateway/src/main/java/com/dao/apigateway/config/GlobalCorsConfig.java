// package com.dao.apigateway.config;
//
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.reactive.CorsWebFilter;
// import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
//
// import java.util.Arrays;
//
// @Configuration
// public class GlobalCorsConfig {
//
//     @Bean
//     public CorsWebFilter corsWebFilter() {
//         CorsConfiguration corsConfig = new CorsConfiguration();
//
//         // Allow specific origins
//         corsConfig.setAllowedOrigins(Arrays.asList(
//             "http://localhost:4173",
//             "http://localhost:3000"
//         ));
//
//         // Allow all methods
//         corsConfig.setAllowedMethods(Arrays.asList(
//             "GET", "POST", "PUT", "DELETE", "OPTIONS"
//         ));
//
//         // Allow all headers
//         corsConfig.setAllowedHeaders(Arrays.asList("*"));
//
//         // Allow credentials
//         corsConfig.setAllowCredentials(true);
//
//         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//         source.registerCorsConfiguration("/**", corsConfig);
//
//         return new CorsWebFilter(source);
//     }
// }
