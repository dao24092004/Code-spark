package com.dao.courseservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableDiscoveryClient
// Đã thêm thư mục của course-service để Spring Boot tìm thấy
// IdentityServiceClient
@EnableFeignClients(basePackages = {
        "com.dao.common.client",
        "com.dao.courseservice"
})
@SpringBootApplication(scanBasePackages = {
        "com.dao.courseservice", // Quét các service, controller của khóa học
        "com.dao.common" // Quét thư viện chung (chứa NotificationProducerService)
})
public class CourseServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CourseServiceApplication.class, args);
    }

}