package com.dao.profileservice.client;

import com.dao.profileservice.dto.FileDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@FeignClient(name = "file-service", path = "/api/v1/files")
public interface FileServiceClient {

    @GetMapping("/user/{userId}")
    List<FileDto> getUserFiles(@PathVariable("userId") Long userId);

    @PostMapping("/upload")
    FileDto uploadFile(@RequestParam("file") MultipartFile file,
                      @RequestParam("userId") Long userId);

    @GetMapping("/{fileId}")
    FileDto getFileById(@PathVariable("fileId") Long fileId);
}