package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseMemberDto {
    private UUID userId;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String email;
    private Integer percentComplete;
}
