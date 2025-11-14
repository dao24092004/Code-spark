package com.dao.fileservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@ConfigurationPropertiesScan("com.dao.fileservice.config")
public class FileServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FileServiceApplication.class, args);
    }

}