package com.dao.identity_service.repository;

import com.dao.identity_service.entity.UserCredential;
import com.dao.identity_service.entity.CredentialType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCredentialRepository extends JpaRepository<UserCredential, UUID> {

    List<UserCredential> findByUserId(UUID userId);

    Optional<UserCredential> findByUserIdAndCredentialTypeAndKeyVersion(
            UUID userId, CredentialType credentialType, Integer keyVersion);

    List<UserCredential> findByUserIdAndCredentialType(UUID userId, CredentialType credentialType);

    @Query("SELECT uc FROM UserCredential uc " +
           "WHERE uc.user.id = :userId " +
           "AND uc.credentialType = :credentialType " +
           "AND (uc.expiresAt IS NULL OR uc.expiresAt > :now) " +
           "ORDER BY uc.keyVersion DESC")
    List<UserCredential> findValidCredentials(
            @Param("userId") UUID userId,
            @Param("credentialType") CredentialType credentialType,
            @Param("now") LocalDateTime now);

    @Query("SELECT MAX(uc.keyVersion) FROM UserCredential uc " +
           "WHERE uc.user.id = :userId " +
           "AND uc.credentialType = :credentialType")
    Optional<Integer> findMaxKeyVersion(
            @Param("userId") UUID userId,
            @Param("credentialType") CredentialType credentialType);

    @Modifying
    @Query("UPDATE UserCredential uc SET uc.expiresAt = :expiresAt " +
           "WHERE uc.user.id = :userId AND uc.credentialType = :credentialType")
    void expireCredentials(
            @Param("userId") UUID userId,
            @Param("credentialType") CredentialType credentialType,
            @Param("expiresAt") LocalDateTime expiresAt);

    void deleteByUserId(UUID userId);

    void deleteByUserIdAndCredentialType(UUID userId, CredentialType credentialType);
}
