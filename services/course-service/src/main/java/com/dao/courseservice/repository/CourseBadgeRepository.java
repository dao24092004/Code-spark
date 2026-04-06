package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CourseBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseBadgeRepository extends JpaRepository<CourseBadge, UUID> {

    List<CourseBadge> findByCourseId(UUID courseId);

    List<CourseBadge> findByOrganizationId(UUID organizationId);

    Optional<CourseBadge> findByOrganizationIdAndBadgeName(UUID organizationId, String badgeName);
}
