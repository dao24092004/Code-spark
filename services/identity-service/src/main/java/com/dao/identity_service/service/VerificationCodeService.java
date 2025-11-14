package com.dao.identity_service.service;

import com.dao.identity_service.entity.User;
import com.dao.identity_service.entity.VerificationCode;
import com.dao.identity_service.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    private final VerificationCodeRepository verificationCodeRepository;

    public String createVerificationCode(User user) {
        String code = UUID.randomUUID().toString();
        VerificationCode verificationCode = new VerificationCode(
                code,
                LocalDateTime.now().plusMinutes(15),
                user
        );
        verificationCodeRepository.save(verificationCode);
        return code;
    }

    public VerificationCode getVerificationCode(String code) {
        return verificationCodeRepository.findByCode(code).orElse(null);
    }

    public void deleteVerificationCode(Long id) {
        verificationCodeRepository.deleteById(id);
    }
}
