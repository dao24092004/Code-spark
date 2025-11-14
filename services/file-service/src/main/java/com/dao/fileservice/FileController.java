package com.dao.fileservice;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import com.dao.fileservice.security.AuthorizationService;
import com.dao.fileservice.security.Permissions;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final AuthorizationService authorizationService;

    public FileController(FileStorageService fileStorageService, AuthorizationService authorizationService) {
        this.fileStorageService = fileStorageService;
        this.authorizationService = authorizationService;
    }

    /**
     * Tải lên một tệp.
     */
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_WRITE);
        String fileUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(fileUrl);
    }

    /**
     * Tải lên nhiều tệp.
     */
    @PostMapping("/uploadMultiple")
    public ResponseEntity<List<String>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_WRITE);
        List<String> fileUrls = Arrays.stream(files)
                .map(fileStorageService::storeFile)
                .collect(Collectors.toList());
        return ResponseEntity.ok(fileUrls);
    }


    private String extractBearerToken(HttpServletRequest request) {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(auth) || !auth.startsWith("Bearer ")) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }
        return auth.substring(7);
    }
}

