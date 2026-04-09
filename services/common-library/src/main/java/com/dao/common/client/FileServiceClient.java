package com.dao.common.client;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@FeignClient(name = "file-service", path = "/api/internal/files")
public interface FileServiceClient {

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<String> uploadFile(@RequestPart("file") MultipartFile file);

    @PostMapping(value = "/uploadMultiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<List<String>> uploadMultipleFiles(@RequestPart("files") MultipartFile[] files);
}