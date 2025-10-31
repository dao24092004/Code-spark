package com.dao.courseservice.request;

import lombok.Data;

@Data
public class UpdateQuizRequest {
    // Chỉ cho phép cập nhật các trường này
    // Việc cập nhật câu hỏi/đáp án sẽ là nghiệp vụ phức tạp hơn
    private String title;
    private String description;
    private Integer timeLimitMinutes;
}