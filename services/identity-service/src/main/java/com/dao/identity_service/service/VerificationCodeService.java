package com.dao.identity_service.service;

import com.dao.identity_service.entity.User;
import com.dao.identity_service.entity.VerificationCode;
import com.dao.identity_service.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class VerificationCodeService {

    private final VerificationCodeRepository verificationCodeRepository;

    @Transactional
    public VerificationCode createVerificationCode(User user, String type) {
        String code = String.format("%06d", (int) (Math.random() * 1000000));
        VerificationCode verificationCode = VerificationCode.builder()
                .user(user)
                .code(code)
                .type(type)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .isUsed(false)
                .build();
        return verificationCodeRepository.save(verificationCode);
    }

    public Optional<VerificationCode> getVerificationCode(UUID id) {
        return verificationCodeRepository.findById(id);
    }

    public Optional<VerificationCode> getVerificationCodeByCode(String code) {
        return verificationCodeRepository.findByCode(code);
    }

    public Optional<VerificationCode> findValidCode(UUID userId, String code) {
        return verificationCodeRepository.findValidCode(userId, code, LocalDateTime.now());
    }

    public Optional<VerificationCode> findLatestValidCode(UUID userId) {
        return verificationCodeRepository.findLatestValidCode(userId, LocalDateTime.now());
    }

    @Transactional
    public void markAsUsed(VerificationCode verificationCode) {
        verificationCode.setIsUsed(true);
        verificationCodeRepository.save(verificationCode);
    }

    @Transactional
    public void deleteVerificationCode(UUID id) {
        verificationCodeRepository.deleteById(id);
    }

    @Transactional
    public void deleteExpiredCodes() {
        verificationCodeRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
