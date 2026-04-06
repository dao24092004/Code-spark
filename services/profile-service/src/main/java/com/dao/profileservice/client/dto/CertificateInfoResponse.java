package com.dao.profileservice.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateInfoResponse {
    private UUID id;
    private String title;
    private String description;
    private String certificateUrl;
    private UUID courseId;
    private String courseName;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
}
