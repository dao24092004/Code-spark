// src/main/java/com/dao/courseservice/config/WebClientConfig.java
package com.dao.courseservice.config;

// (XÓA BỎ) import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.beans.factory.annotation.Value; // (THÊM MỚI)
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // (THÊM MỚI) Lấy URL của Gateway từ .properties
    @Value("${app.services.api-gateway.url}")
    private String apiGatewayUrl;

    /**
     * (SỬA LẠI) 
     * Chúng ta sẽ tạo 1 Bean WebClient ĐÃ CẤU HÌNH SẴN.
     * Tên của hàm này ("apiGatewayWebClient") chính là tên Bean.
     */
    @Bean
    // (XÓA BỎ) @LoadBalanced
    public WebClient apiGatewayWebClient() {
        return WebClient.builder()
                .baseUrl(apiGatewayUrl) // Đặt URL gốc (ví dụ: http://localhost:8080)
                .build();
    }
}