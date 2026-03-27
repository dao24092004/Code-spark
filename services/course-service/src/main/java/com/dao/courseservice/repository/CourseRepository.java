package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID>, JpaSpecificationExecutor<Course> {

    @EntityGraph(attributePaths = {"metadataList"})
    @Query("SELECT c FROM Course c WHERE c.organizationId = :orgId")
    List<Course> findByOrganizationIdWithMetadata(@Param("orgId") UUID orgId);

    @EntityGraph(attributePaths = {"materials", "quizzes", "metadataList", "quizzes.questions", "quizzes.questions.options"})
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdWithAllDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"materials", "quizzes", "quizzes.questions", "quizzes.questions.options"})
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdWithRelations(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"progressList"})
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdWithProgress(@Param("id") UUID id);

    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findActiveById(@Param("id") UUID id);

    @Query("SELECT c FROM Course c WHERE c.slug = :slug")
    Optional<Course> findActiveBySlug(@Param("slug") String slug);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Course c WHERE c.slug = :slug")
    boolean existsActiveBySlug(@Param("slug") String slug);

    @Query("SELECT c FROM Course c WHERE c.organizationId = :organizationId")
    List<Course> findByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT c FROM Course c WHERE c.organizationId = :organizationId")
    Page<Course> findByOrganizationId(@Param("organizationId") UUID organizationId, Pageable pageable);

    @Query("SELECT c FROM Course c " +
           "LEFT JOIN FETCH c.materials " +
           "LEFT JOIN FETCH c.quizzes " +
           "WHERE c.id = :courseId")
    Optional<Course> findByIdWithMaterialsAndQuizzes(@Param("courseId") UUID courseId);

    @Query("SELECT c FROM Course c ORDER BY c.createdAt DESC")
    Page<Course> findPopularCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.visibility = 'PUBLIC' ORDER BY c.createdAt DESC")
    Page<Course> findPublicCourses(Pageable pageable);

    @Query("SELECT c FROM Course c " +
           "WHERE c.visibility = 'PUBLIC' " +
           "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Course> searchPublicCourses(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.createdBy = :createdBy")
    List<Course> findByCreatedBy(@Param("createdBy") UUID createdBy);

    @Query("SELECT c FROM Course c WHERE c.createdBy = :createdBy")
    Page<Course> findByCreatedBy(@Param("createdBy") UUID createdBy, Pageable pageable);

    @Query("SELECT COUNT(DISTINCT p.studentId) FROM Progress p WHERE p.course.id = :courseId")
    long countStudentsByCourseId(@Param("courseId") UUID courseId);

    Optional<Course> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Course> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
