package com.dao.courseservice.request;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Value;

/**
 * Bộ tiêu chí lọc khóa học được truyền từ query params.
 */
@Value
@Builder
public class CourseFilterCriteria {
    String keyword;
    String organizationId;
    Long createdBy;
    String visibility;
    LocalDateTime createdFrom;
    LocalDateTime createdTo;
}
