package com.dao.examservice.dto.request;

import java.time.Instant;
import java.util.List;

public class ExamScheduleRequest {
    public List<Long> candidateIds;
    public Instant startAt; // optional: update exam window
    public Instant endAt;   // optional: update exam window
}


