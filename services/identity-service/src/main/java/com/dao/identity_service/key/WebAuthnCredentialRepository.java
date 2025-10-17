package com.dao.identity_service.key;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {

    Optional<WebAuthnCredential> findByCredentialId(byte[] credentialId);

    List<WebAuthnCredential> findByUsername(String username);

    @Query("SELECT c FROM WebAuthnCredential c WHERE c.username = :username ORDER BY c.createdAt DESC LIMIT 1")
    Optional<WebAuthnCredential> findUserIdByUsername(@Param("username") String username);

    Optional<WebAuthnCredential> findFirstByUsernameOrderByCreatedAtDesc(String username);
}