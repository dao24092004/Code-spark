package com.dao.courseservice.response;

import lombok.Data;

import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String email;
}
