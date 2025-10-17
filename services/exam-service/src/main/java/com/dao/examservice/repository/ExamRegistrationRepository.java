package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRegistrationRepository extends JpaRepository<ExamRegistration, Long> {

    // Tìm đăng ký theo student ID
    List<ExamRegistration> findByStudentId(Long studentId);

    // Tìm đăng ký theo exam ID
    List<ExamRegistration> findByExamId(Long examId);

    // Tìm đăng ký theo student ID và exam ID
    Optional<ExamRegistration> findByStudentIdAndExamId(Long studentId, Long examId);

    // Tìm đăng ký theo status
    List<ExamRegistration> findByStatus(ExamRegistration.RegistrationStatus status);

    // Tìm đăng ký trong khoảng thời gian
    @Query("SELECT er FROM ExamRegistration er WHERE er.examStartTime >= :startTime AND er.examEndTime <= :endTime")
    List<ExamRegistration> findRegistrationsByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Đếm số lượng đăng ký của một exam
    @Query("SELECT COUNT(er) FROM ExamRegistration er WHERE er.exam.id = :examId")
    Long countByExamId(@Param("examId") Long examId);

    // Tìm đăng ký sắp diễn ra
    @Query("SELECT er FROM ExamRegistration er WHERE er.examStartTime > :now AND er.status = 'REGISTERED'")
    List<ExamRegistration> findUpcomingRegistrations(@Param("now") LocalDateTime now);
}
