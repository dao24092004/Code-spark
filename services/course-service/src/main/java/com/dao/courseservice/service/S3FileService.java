package com.dao.courseservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3FileService {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${cloud.aws.s3.url}")
    private String s3Url;

    /**
     * Upload file to S3/MinIO and return public URL
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String filename = folder + "/" + UUID.randomUUID() + "-" + Instant.now().toEpochMilli() + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filename)
                    .contentType(file.getContentType())
                    .acl(ObjectCannedACL.PUBLIC_READ)  // Make file publicly accessible
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            String publicUrl = generatePublicUrl(filename);
            log.info("Uploaded file to S3: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", e.getMessage());
            throw new IOException("Failed to upload file to S3", e);
        }
    }

    /**
     * Generate public URL for accessing the file
     */
    public String generatePublicUrl(String filename) {
        // For MinIO: http://localhost:9000/{bucket}/{filename}
        return String.format("%s/%s/%s", s3Url, bucketName, filename);
    }

    /**
     * Generate presigned URL (for private access with expiration)
     */
    public String generatePresignedUrl(String filename, Duration expiration) {
        try (S3Presigner presigner = S3Presigner.builder()
                .region(software.amazon.awssdk.regions.Region.US_EAST_1)
                .build()) {

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filename)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        }
    }

    /**
     * Delete file from S3
     */
    public void deleteFile(String filename) {
        try {
            s3Client.deleteObject(builder -> builder
                    .bucket(bucketName)
                    .key(filename)
                    .build());
            log.info("Deleted file from S3: {}", filename);
        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", e.getMessage());
        }
    }
}

