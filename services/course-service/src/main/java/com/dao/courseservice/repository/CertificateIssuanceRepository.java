package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CertificateIssuance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CertificateIssuanceRepository extends JpaRepository<CertificateIssuance, UUID> {

    List<CertificateIssuance> findByCertificateId(UUID certificateId);

    @Query("SELECT ci FROM CertificateIssuance ci WHERE ci.certificate.id = :certificateId ORDER BY ci.performedAt DESC")
    List<CertificateIssuance> findHistoryByCertificateId(@Param("certificateId") UUID certificateId);
}
