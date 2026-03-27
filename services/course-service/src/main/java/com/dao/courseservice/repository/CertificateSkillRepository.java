package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CertificateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CertificateSkillRepository extends JpaRepository<CertificateSkill, UUID> {

    List<CertificateSkill> findByCertificateId(UUID certificateId);
}
