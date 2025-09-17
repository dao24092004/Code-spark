package com.dao.profileservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileDto {
    private Long id;
    private String fileName;
    private String originalFileName;
    private String contentType;
    private Long size;
    private String filePath;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}