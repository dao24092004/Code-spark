package com.dao.onlineexamservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OnlineExamServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlineExamServiceApplication.class, args);
    }

}
