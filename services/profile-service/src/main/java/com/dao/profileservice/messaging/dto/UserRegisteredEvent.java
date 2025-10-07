package com.dao.profileservice.messaging.dto;

import lombok.Data;

@Data
public class UserRegisteredEvent {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
}
