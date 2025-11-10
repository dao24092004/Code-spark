package com.dao.fileservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileUploadResponse {
    private String fileName;
    private String downloadUrl;
    private String contentType;
    private long size;
}

