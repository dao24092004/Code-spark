package com.dao.identity_service.service;

import com.dao.common.exception.AppException;
import com.dao.identity_service.dto.AuthResponse;
import com.dao.identity_service.dto.LoginRequest;
import com.dao.identity_service.dto.RegisterRequest;
import com.dao.identity_service.dto.UserDto;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.entity.VerificationCode;
import com.dao.identity_service.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final VerificationCodeService verificationCodeService;
    private final EmailService emailService;
  

    public AuthResponse register(RegisterRequest request) {
        UserDto savedUser = userService.createUser(request);
        
        // Get actual User entity for token generation
        User userEntity = userService.findByUsername(savedUser.getUsername())
                .orElseThrow(() -> new AppException("User not found after creation", HttpStatus.INTERNAL_SERVER_ERROR));
        
        String accessToken = jwtService.generateTokenWithUserId(userEntity, String.valueOf(savedUser.getId()));
        String refreshToken = jwtService.generateRefreshToken(userEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDto(userEntity))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userService.findByUsernameOrEmail(request.getUsernameOrEmail())
                .orElseThrow(() -> new AppException("Invalid username or password", HttpStatus.UNAUTHORIZED));

        if (user.getProvider() != com.dao.identity_service.entity.AuthProvider.LOCAL) {
            throw new AppException("You have registered using " + user.getProvider() + ". Please log in with your " + user.getProvider() + " account.", HttpStatus.BAD_REQUEST);
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsernameOrEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            throw new AppException("Invalid username or password", HttpStatus.UNAUTHORIZED);
        }

        userService.updateLastLogin(user.getUsername());
        
        String accessToken = jwtService.generateTokenWithUserId(user, String.valueOf(user.getId()));
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDto(user))
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (jwtService.isTokenValid(refreshToken, user)) {
            String newAccessToken = jwtService.generateTokenWithUserId(user, String.valueOf(user.getId()));
            String newRefreshToken = jwtService.generateRefreshToken(user);

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .user(mapToUserDto(user))
                    .build();
        } else {
            throw new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED);
        }
    }

    public AuthResponse generateAuthResponseForUser(User user) {
        userService.updateLastLogin(user.getUsername());
        
        String accessToken = jwtService.generateTokenWithUserId(user, String.valueOf(user.getId()));
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDto(user))
                .build();
    }

    public void sendVerificationEmail(String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        String code = verificationCodeService.createVerificationCode(user);
        emailService.sendEmail(email, "Email Verification", "Your verification code is: " + code);
    }

    public AuthResponse verifyEmail(String code) {
        VerificationCode verificationCode = verificationCodeService.getVerificationCode(code);
        if (verificationCode == null || verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Invalid or expired verification code", HttpStatus.BAD_REQUEST);
        }
        User user = verificationCode.getUser();
        user.setEnabled(true);
        userService.updateUser(user.getId(), null);
        verificationCodeService.deleteVerificationCode(verificationCode.getId());
        return generateAuthResponseForUser(user);
    }

    private AuthResponse.UserDto mapToUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toSet()))
                .permissions(user.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .collect(Collectors.toSet()))
                .build();
    }
}