package com.codespark.identityservice.key;

import com.webauthn4j.data.attestation.authenticator.AuthenticatorData;
import com.webauthn4j.data.attestation.statement.AttestationStatement;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "webauthn_credential")
@Getter
@Setter
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    private byte[] credentialId;

    private String username;

    @Lob
    private AuthenticatorData authenticatorData;

    @Lob
    private AttestationStatement attestationStatement;

    private long counter;

}
