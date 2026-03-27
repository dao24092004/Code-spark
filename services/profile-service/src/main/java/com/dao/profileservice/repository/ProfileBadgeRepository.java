package com.dao.profileservice.repository;

import com.dao.profileservice.entity.ProfileBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileBadgeRepository extends JpaRepository<ProfileBadge, UUID> {

    List<ProfileBadge> findByProfileId(UUID profileId);

    List<ProfileBadge> findByBadgeName(String badgeName);

    Optional<ProfileBadge> findByProfileIdAndBadgeName(UUID profileId, String badgeName);

    boolean existsByProfileIdAndBadgeName(UUID profileId, String badgeName);
}
