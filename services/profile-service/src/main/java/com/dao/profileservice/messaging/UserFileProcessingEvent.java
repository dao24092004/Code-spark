package com.dao.profileservice.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFileProcessingEvent {
    private Long userId;
    private String operation;
    private Object data;
    private Long timestamp;
}