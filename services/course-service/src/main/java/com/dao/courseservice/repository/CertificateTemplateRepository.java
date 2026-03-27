package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, UUID> {

    List<CertificateTemplate> findByOrganizationId(UUID organizationId);

    Optional<CertificateTemplate> findByOrganizationIdAndIsDefaultTrue(UUID organizationId);
}
