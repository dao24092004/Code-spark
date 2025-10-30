package com.dao.identity_service.key;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {

    @Query("SELECT c FROM WebAuthnCredential c WHERE c.credentialId = :credentialId")
    Optional<WebAuthnCredential> findByCredentialId(@Param("credentialId") byte[] credentialId);

    List<WebAuthnCredential> findByUsername(String username);

    @Query(value = "SELECT * FROM webauthn_credential WHERE username = :username ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<WebAuthnCredential> findUserIdByUsername(@Param("username") String username);

    Optional<WebAuthnCredential> findFirstByUsernameOrderByCreatedAtDesc(String username);
}