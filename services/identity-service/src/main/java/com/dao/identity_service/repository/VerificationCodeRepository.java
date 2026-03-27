package com.dao.identity_service.repository;

import com.dao.identity_service.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {

    Optional<VerificationCode> findByCode(String code);

    @Query("SELECT vc FROM VerificationCode vc " +
           "WHERE vc.user.id = :userId " +
           "AND vc.code = :code " +
           "AND vc.isUsed = false " +
           "AND vc.expiresAt > :now")
    Optional<VerificationCode> findValidCode(
            @Param("userId") UUID userId,
            @Param("code") String code,
            @Param("now") LocalDateTime now);

    @Query("SELECT vc FROM VerificationCode vc " +
           "WHERE vc.user.id = :userId " +
           "AND vc.expiresAt > :now " +
           "AND vc.isUsed = false")
    Optional<VerificationCode> findLatestValidCode(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM VerificationCode vc WHERE vc.expiresAt < :now")
    void deleteByExpiresAtBefore(@Param("now") LocalDateTime now);
}
