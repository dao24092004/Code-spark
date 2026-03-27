package com.dao.examservice.dto.request;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ExamScheduleRequest {
    public List<UUID> candidateIds;
    public Instant startAt;
    public Instant endAt;
}
