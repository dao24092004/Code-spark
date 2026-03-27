package com.dao.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.dao.identity_service.key.WebAuthnCredential;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    UUID id;

    @Column(name = "username", unique = true, nullable = false, length = 100)
    String username;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    String email;

    @Column(name = "password_hash", length = 255)
    String passwordHash;

    @Column(name = "first_name", length = 100)
    String firstName;

    @Column(name = "last_name", length = 100)
    String lastName;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    String avatarUrl;

    @Column(name = "phone_number", length = 50)
    String phoneNumber;

    @Column(name = "provider", length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "status", length = 50)
    @Builder.Default
    String status = "ACTIVE";

    @Column(name = "is_email_verified")
    @Builder.Default
    Boolean isEmailVerified = false;

    @Column(name = "is_enabled")
    @Builder.Default
    Boolean isEnabled = true;

    @Column(name = "last_login_at")
    LocalDateTime lastLoginAt;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    Set<UserRole> userRoles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    Set<UserPermission> userPermissions = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    Set<UserCredential> userCredentials = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    Set<VerificationCode> verificationCodes = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    Set<WebAuthnCredential> webAuthnCredentials = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.isEmailVerified == null) {
            this.isEmailVerified = false;
        }
        if (this.isEnabled == null) {
            this.isEnabled = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();

        for (UserRole ur : userRoles) {
            Role role = ur.getRole();
            if (role != null && role.getRolePermissions() != null) {
                role.getRolePermissions().forEach(rp -> {
                    Permission permission = rp.getPermission();
                    if (permission != null) {
                        authorities.add(() -> permission.getName());
                    }
                });
            }
        }

        for (UserPermission up : userPermissions) {
            Permission permission = up.getPermission();
            if (permission != null) {
                authorities.add(() -> permission.getName());
            }
        }

        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"LOCKED".equals(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isEnabled != null && isEnabled;
    }

    public void addRole(Role role) {
        UserRole userRole = UserRole.builder()
                .user(this)
                .role(role)
                .build();
        this.userRoles.add(userRole);
    }

    public void removeRole(Role role) {
        this.userRoles.removeIf(ur -> ur.getRole() != null && ur.getRole().equals(role));
    }
}
