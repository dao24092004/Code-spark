// src/main/java/com/dao/courseservice/response/CourseMemberDto.java
package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// (TẠO MỚI)
// DTO này dùng để trả về cho API "Xem danh sách lớp" (getCourseRoster)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseMemberDto {
    
    private Long studentId;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private Integer percentComplete; // Lấy từ bảng Progress
}