package com.dao.profileservice.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileCreatedEvent {
    private Long userId;     // Long từ identity-service
    private UUID profileId;  // UUID - PK của profile
    private Long timestamp;
}
