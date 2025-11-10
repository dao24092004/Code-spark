package com.dao.fileservice;

import com.dao.fileservice.dto.ApiResponse;
import com.dao.fileservice.dto.FileUploadResponse;
import com.dao.fileservice.security.AuthorizationService;
import com.dao.fileservice.security.Permissions;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AuthorizationService authorizationService;

    /**
     * Tải lên một tệp.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_WRITE);
        String fileName = fileStorageService.storeFile(file);

        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/files/download/")
                .path(fileName)
                .toUriString();

        FileUploadResponse response = FileUploadResponse.builder()
                .fileName(fileName)
                .downloadUrl(fileDownloadUri)
                .contentType(file.getContentType())
                .size(file.getSize())
                .build();

        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
    }

    /**
     * Tải lên nhiều tệp.
     */
    @PostMapping("/uploadMultiple")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_WRITE);
        List<FileUploadResponse> uploads = Arrays.stream(files)
                .map(file -> {
                    String fileName = fileStorageService.storeFile(file);
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/files/download/")
                            .path(fileName)
                            .toUriString();
                    return FileUploadResponse.builder()
                            .fileName(fileName)
                            .downloadUrl(fileDownloadUri)
                            .contentType(file.getContentType())
                            .size(file.getSize())
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Files uploaded successfully", uploads));
    }

    /**
     * Tải xuống một tệp.
     */
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_READ);
        // Load file as Resource
        Path filePath = Paths.get("./uploads").toAbsolutePath().normalize().resolve(fileName).normalize();
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("application/octet-stream"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }

    private String extractBearerToken(HttpServletRequest request) {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(auth) || !auth.startsWith("Bearer ")) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }
        return auth.substring(7);
    }
}

