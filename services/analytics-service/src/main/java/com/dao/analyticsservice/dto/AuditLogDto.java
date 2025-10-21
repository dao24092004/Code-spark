package com.dao.analyticsservice.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class AuditLogDto {
    private UUID id;
    private String actorId;
    private String actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private String before;
    private String after;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
}
