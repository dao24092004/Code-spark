package com.dao.profileservice.client;

import com.dao.common.dto.ApiResponse;
import com.dao.profileservice.client.dto.CertificateInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "certificate-service", url = "${app.services.certificate-service.url:http://localhost:9010}")
public interface CertificateServiceClient {

    /**
     * Lấy danh sách chứng nhận của một user.
     * 
     * @param userId ID của người dùng
     * @return Danh sách thông tin chứng nhận
     */
    @GetMapping("/api/v1/certificates/user/{userId}")
    ApiResponse<List<CertificateInfoResponse>> getUserCertificates(@PathVariable("userId") Long userId);

    /**
     * Lấy thông tin chi tiết một chứng nhận.
     * 
     * @param certificateId ID của chứng nhận
     * @return Thông tin chứng nhận
     */
    @GetMapping("/api/v1/certificates/{certificateId}")
    ApiResponse<CertificateInfoResponse> getCertificateById(@PathVariable("certificateId") UUID certificateId);
}
