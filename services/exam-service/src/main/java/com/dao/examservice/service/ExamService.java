package com.dao.examservice.service;

import com.dao.examservice.dto.request.ExamConfigRequest;
import com.dao.examservice.dto.request.ExamCreationRequest;
import com.dao.examservice.dto.request.ExamScheduleRequest;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.exception.ResourceNotFoundException;
import com.dao.examservice.repository.ExamRegistrationRepository;
import com.dao.examservice.repository.ExamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamRegistrationRepository registrationRepository;

    public ExamService(ExamRepository examRepository, ExamRegistrationRepository registrationRepository) {
        this.examRepository = examRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional
    public Exam createExam(ExamCreationRequest request) {
        Exam exam = new Exam();
        exam.setOrgId(request.orgId);
        exam.setTitle(request.title);
        exam.setDescription(request.description);
        exam.setStartAt(request.startAt);
        exam.setEndAt(request.endAt);
        exam.setDurationMinutes(request.durationMinutes);
        exam.setPassScore(request.passScore);
        exam.setMaxAttempts(request.maxAttempts);
        exam.setCreatedBy(request.createdBy);
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateConfig(UUID id, ExamConfigRequest request) {
        Exam exam = examRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        exam.setDurationMinutes(request.durationMinutes);
        exam.setPassScore(request.passScore);
        exam.setMaxAttempts(request.maxAttempts);
        return examRepository.save(exam);
    }

    @Transactional(readOnly = true)
    public Exam get(UUID id) {
        return examRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
    }

    @Transactional
    public Exam scheduleAndRegister(UUID examId, ExamScheduleRequest request) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        if (request.startAt != null) {
            exam.setStartAt(request.startAt);
        }
        if (request.endAt != null) {
            exam.setEndAt(request.endAt);
        }

        if (request.candidateIds != null && !request.candidateIds.isEmpty()) {
            List<ExamRegistration> registrations = new java.util.ArrayList<>();
            for (UUID candidateId : request.candidateIds) {
                ExamRegistration reg = new ExamRegistration();
                reg.setExam(exam);
                reg.setUserId(candidateId);
                registrations.add(reg);
            }
            registrationRepository.saveAll(registrations);
        }

        return exam;
    }

    @Transactional(readOnly = true)
    public List<Exam> getSchedules(Instant start, Instant end) {
        if (start != null && end != null) {
            return examRepository.findByStartAtGreaterThanEqualAndEndAtLessThanEqual(start, end);
        } else if (start != null) {
            return examRepository.findByStartAtGreaterThanEqual(start);
        } else if (end != null) {
            return examRepository.findByEndAtLessThanEqual(end);
        } else {
            return examRepository.findAll();
        }
    }

    @Transactional
    public void delete(UUID id) {
        examRepository.deleteById(id);
    }
}


