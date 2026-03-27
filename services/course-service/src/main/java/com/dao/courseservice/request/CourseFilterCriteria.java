package com.dao.courseservice.request;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CourseFilterCriteria {
    String keyword;
    UUID organizationId;
    String visibility;
    LocalDateTime createdFrom;
    LocalDateTime createdTo;
}
