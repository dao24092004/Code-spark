package com.dao.identity_service.key;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, UUID> {

    @Query("SELECT c FROM WebAuthnCredential c WHERE c.credentialId = :credentialId")
    Optional<WebAuthnCredential> findByCredentialId(@Param("credentialId") byte[] credentialId);

    List<WebAuthnCredential> findByUsername(String username);

    Optional<WebAuthnCredential> findFirstByUsernameOrderByCreatedAtDesc(String username);

    List<WebAuthnCredential> findByUserId(UUID userId);

    Optional<WebAuthnCredential> findByCredentialIdAndUserId(byte[] credentialId, UUID userId);
}
