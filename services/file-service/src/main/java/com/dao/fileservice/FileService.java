package com.dao.fileservice;

import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    String storeFile(MultipartFile file);
    byte[] downloadFile(String fileName);
    boolean deleteFile(String fileName);
    boolean fileExists(String fileName);
}