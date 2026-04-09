package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;
import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseResponse  implements Serializable {
    private UUID id;
    private UUID createdBy;
    private UUID organizationId;
    private String title;
    private String slug;
    private String description;
    private String thumbnailUrl;
    private String language;
    private Integer durationMinutes;
    private String level;
    private String visibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
