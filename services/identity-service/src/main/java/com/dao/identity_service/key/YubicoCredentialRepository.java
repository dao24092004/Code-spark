package com.dao.identity_service.key;

import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class YubicoCredentialRepository implements CredentialRepository {

    private final WebAuthnCredentialRepository credentialRepository;

    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return credentialRepository.findByUsername(username).stream()
                .map(cred -> PublicKeyCredentialDescriptor.builder().id(new ByteArray(cred.getCredentialId())).build())
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return credentialRepository.findFirstByUsernameOrderByCreatedAtDesc(username)
                .map(cred -> new ByteArray(cred.getUsername().getBytes()));
    }

    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        // This implementation assumes the user handle is the username.
        // In a real-world scenario, you might have a separate mapping.
        return Optional.of(new String(userHandle.getBytes()));
    }

    @Override
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        return credentialRepository.findByCredentialId(credentialId.getBytes())
                .map(cred -> RegisteredCredential.builder()
                        .credentialId(new ByteArray(cred.getCredentialId()))
                        .userHandle(new ByteArray(cred.getUsername().getBytes()))
                        .publicKeyCose(new ByteArray(cred.getPublicKey()))
                        .signatureCount(cred.getCounter())
                        .build());
    }

    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
        return credentialRepository.findByCredentialId(credentialId.getBytes()).stream()
                .map(cred -> RegisteredCredential.builder()
                        .credentialId(new ByteArray(cred.getCredentialId()))
                        .userHandle(new ByteArray(cred.getUsername().getBytes()))
                        .publicKeyCose(new ByteArray(cred.getPublicKey()))
                        .signatureCount(cred.getCounter())
                        .build())
                .collect(Collectors.toSet());
    }
}
