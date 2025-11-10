package com.dao.fileservice;

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
import jakarta.servlet.http.HttpServletRequest;
import com.dao.fileservice.security.AuthorizationService;
import com.dao.fileservice.security.Permissions;

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
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_WRITE);
        String fileName = fileStorageService.storeFile(file);

        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/files/download/")
                .path(fileName)
                .toUriString();

        return ResponseEntity.ok("File uploaded successfully. Download URI: " + fileDownloadUri);
    }

    /**
     * Tải lên nhiều tệp.
     */
    @PostMapping("/uploadMultiple")
    public ResponseEntity<List<String>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files, HttpServletRequest request) {
        String token = extractBearerToken(request);
        authorizationService.requirePermission(token, Permissions.FILE_WRITE);
        List<String> fileDownloadUris = Arrays.asList(files)
                .stream()
                .map(file -> {
                    String fileName = fileStorageService.storeFile(file);
                    return ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/files/download/")
                            .path(fileName)
                            .toUriString();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(fileDownloadUris);
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

