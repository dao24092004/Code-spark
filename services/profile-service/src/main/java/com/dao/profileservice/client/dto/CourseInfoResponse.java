package com.dao.profileservice.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseInfoResponse {
    private UUID id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private Integer duration;
    private String organizationId;
}
