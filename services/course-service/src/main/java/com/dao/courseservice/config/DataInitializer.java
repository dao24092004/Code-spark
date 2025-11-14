package com.dao.courseservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
@Slf4j
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                log.info("Running database initialization script...");
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("init-data.sql"));
                log.info("Database initialization completed successfully!");
            } catch (Exception e) {
                log.error("Error during database initialization: {}", e.getMessage());
                // Không throw exception để không làm crash application
                // Database có thể đã được khởi tạo trước đó
            }
        };
    }
}
