package com.dao.identity_service.service;

import com.dao.identity_service.entity.AdminAuditTrail;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.repository.AdminAuditTrailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuditService {

    private final AdminAuditTrailRepository auditTrailRepository;

    @Transactional
    public void logAction(User admin, String action, String targetType, UUID targetId,
                          String oldValue, String newValue, String ipAddress, String userAgent) {
        AdminAuditTrail auditTrail = AdminAuditTrail.builder()
                .user(admin)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        auditTrailRepository.save(auditTrail);
        log.debug("Audit trail logged: {} by {} on {}:{}", action, admin.getUsername(), targetType, targetId);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditTrail> findByUser(UUID userId, Pageable pageable) {
        return auditTrailRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditTrail> findByTarget(String targetType, UUID targetId, Pageable pageable) {
        return auditTrailRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditTrail> findByAction(String action, Pageable pageable) {
        return auditTrailRepository.findByAction(action, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditTrail> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditTrailRepository.findByDateRange(start, end, pageable);
    }
}
