package com.dao.fileservice; // Khuyên bạn nên tạo package .controller rồi bỏ file này vào cho chuẩn kiến trúc nhé

import com.dao.common.dto.ApiResponse; // Nhớ import ApiResponse từ thư viện common của bạn
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/files") // Thêm khu vực "Staff Only"
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /**
     * Tải lên một tệp (Chỉ dùng cho service nội bộ).
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadFile(@RequestPart("file") MultipartFile file) {
        // Gọi thẳng service lưu file, không cần lo xác thực nữa
        String fileUrl = fileStorageService.storeFile(file);
        return ApiResponse.success("Upload thành công", fileUrl);
    }

    /**
     * Tải lên nhiều tệp (Chỉ dùng cho service nội bộ).
     */
    @PostMapping(value = "/uploadMultiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadMultipleFiles(@RequestPart("files") MultipartFile[] files) {
        // Logic gọn gàng, chạy cực nhanh
        List<String> fileUrls = Arrays.stream(files)
                .map(fileStorageService::storeFile)
                .collect(Collectors.toList());
        return ApiResponse.success("Upload nhiều file thành công", fileUrls);
    }
}