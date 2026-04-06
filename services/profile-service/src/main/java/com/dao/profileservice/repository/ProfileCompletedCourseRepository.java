package com.dao.profileservice.repository;

import com.dao.profileservice.entity.ProfileCompletedCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileCompletedCourseRepository extends JpaRepository<ProfileCompletedCourse, UUID> {

    List<ProfileCompletedCourse> findByProfileId(UUID profileId);

    List<ProfileCompletedCourse> findByCourseId(UUID courseId);

    Optional<ProfileCompletedCourse> findByProfileIdAndCourseId(UUID profileId, UUID courseId);

    boolean existsByProfileIdAndCourseId(UUID profileId, UUID courseId);

    long countByProfileId(UUID profileId);
}
