package com.dao.courseservice.response;
import lombok.Data;
import java.util.List;

@Data
public class RoleDto {
    // API trả về: { "role": "instructor" } hoặc { "role": "admin" }
    private String role;
    private List<String> permissions;
}