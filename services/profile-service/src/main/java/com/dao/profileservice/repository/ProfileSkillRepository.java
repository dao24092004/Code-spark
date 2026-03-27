package com.dao.profileservice.repository;

import com.dao.profileservice.entity.ProfileSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileSkillRepository extends JpaRepository<ProfileSkill, UUID> {

    List<ProfileSkill> findByProfileId(UUID profileId);

    List<ProfileSkill> findBySkillName(String skillName);

    Optional<ProfileSkill> findByProfileIdAndSkillName(UUID profileId, String skillName);

    boolean existsByProfileIdAndSkillName(UUID profileId, String skillName);
}
