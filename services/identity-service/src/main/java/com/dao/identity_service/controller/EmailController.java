package com.dao.identity_service.controller;

import com.dao.identity_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public String sendEmail(@RequestParam String to, @RequestParam String subject, @RequestParam String body) {
        emailService.sendEmail(to, subject, body);
        return "Email sent successfully";
    }
}