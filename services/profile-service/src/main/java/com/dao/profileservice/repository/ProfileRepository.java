package com.dao.profileservice.repository;

import com.dao.profileservice.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByUserId(UUID userId);

    Optional<Profile> findByEmail(String email);

    boolean existsByUserId(UUID userId);

    boolean existsByEmail(String email);

    @Query("SELECT p FROM Profile p LEFT JOIN FETCH p.certificates LEFT JOIN FETCH p.badges LEFT JOIN FETCH p.completedCourses LEFT JOIN FETCH p.skills WHERE p.userId = :userId")
    Optional<Profile> findByUserIdWithDetails(@Param("userId") UUID userId);
}
