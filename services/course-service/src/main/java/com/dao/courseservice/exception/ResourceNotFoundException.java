package com.dao.courseservice.exception;

import com.dao.common.exception.AppException; // Import từ common library
import org.springframework.http.HttpStatus;

/**
 * Exception được ném ra khi không tìm thấy một tài nguyên.
 * Kế thừa từ AppException để GlobalExceptionHandler có thể bắt và xử lý.
 */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        // Gọi constructor của lớp cha với mã lỗi 404 Not Found
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue), HttpStatus.NOT_FOUND);
    }
}