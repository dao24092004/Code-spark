package com.dao.profileservice.repository;

import com.dao.profileservice.entity.ProfileCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileCertificateRepository extends JpaRepository<ProfileCertificate, UUID> {

    List<ProfileCertificate> findByProfileId(UUID profileId);

    List<ProfileCertificate> findByCertificateId(UUID certificateId);

    Optional<ProfileCertificate> findByProfileIdAndCertificateId(UUID profileId, UUID certificateId);

    boolean existsByProfileIdAndCertificateId(UUID profileId, UUID certificateId);

    void deleteByProfileIdAndCertificateId(UUID profileId, UUID certificateId);
}
