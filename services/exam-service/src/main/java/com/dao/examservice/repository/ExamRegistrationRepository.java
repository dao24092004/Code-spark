package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ExamRegistrationRepository extends JpaRepository<ExamRegistration, UUID> {
}


