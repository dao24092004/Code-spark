package com.dao.profileservice.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdatedEvent {
    private Long userId;
    private Long profileId;
    private Long timestamp;
}