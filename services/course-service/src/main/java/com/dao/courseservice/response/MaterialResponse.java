package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO để định hình dữ liệu học liệu trả về cho client.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MaterialResponse {
    private UUID id;
    private String title;
    private String type;
    private String storageKey;
    private String content;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}