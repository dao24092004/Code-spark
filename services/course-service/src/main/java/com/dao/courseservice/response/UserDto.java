package com.dao.courseservice.response;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String avatarUrl;
}