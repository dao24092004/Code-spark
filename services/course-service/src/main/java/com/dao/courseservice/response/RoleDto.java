package com.dao.courseservice.response;
import lombok.Data;

@Data
public class RoleDto {
    // API trả về: { "role": "instructor" } hoặc { "role": "admin" }
    private String role;
}