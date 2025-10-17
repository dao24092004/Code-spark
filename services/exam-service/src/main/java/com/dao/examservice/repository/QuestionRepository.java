package com.dao.examservice.repository;

import com.dao.examservice.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Tìm câu hỏi theo exam ID
    @Query("SELECT q FROM Question q WHERE q.exam.id = :examId")
    List<Question> findByExamId(@Param("examId") Long examId);

    // Tìm câu hỏi theo độ khó
    @Query("SELECT q FROM Question q WHERE q.difficulty = :difficulty")
    List<Question> findByDifficulty(@Param("difficulty") Integer difficulty);

    // Tìm câu hỏi theo loại
    @Query("SELECT q FROM Question q WHERE q.type = :type")
    List<Question> findByType(@Param("type") String type);

    // Tìm câu hỏi theo exam ID và độ khó
    @Query("SELECT q FROM Question q WHERE q.exam.id = :examId AND q.difficulty = :difficulty")
    List<Question> findByExamIdAndDifficulty(@Param("examId") Long examId, @Param("difficulty") Integer difficulty);
}
