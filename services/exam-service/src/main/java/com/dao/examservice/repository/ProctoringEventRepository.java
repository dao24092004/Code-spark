package com.dao.examservice.repository;

import com.dao.examservice.entity.ProctoringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProctoringEventRepository extends JpaRepository<ProctoringEvent, UUID> {

    @Query("SELECT pe FROM ProctoringEvent pe WHERE pe.session.id = :sessionId ORDER BY pe.timestamp ASC")
    List<ProctoringEvent> findBySessionIdOrderByTimestampAsc(@Param("sessionId") UUID sessionId);

    @Query("SELECT pe FROM ProctoringEvent pe WHERE pe.session.id = :sessionId AND pe.eventType = :eventType ORDER BY pe.timestamp ASC")
    List<ProctoringEvent> findBySessionIdAndEventType(
            @Param("sessionId") UUID sessionId,
            @Param("eventType") String eventType);

    long countBySessionId(UUID sessionId);
}
