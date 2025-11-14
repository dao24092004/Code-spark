package com.dao.courseservice.request;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor // Cần thiết để new BatchUserRequest(studentIds)
public class BatchUserRequest {
    private List<Long> userIds; // Khớp với JSON: { "userIds": [...] }
}