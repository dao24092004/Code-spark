package com.dao.courseservice.exception;

import com.dao.common.exception.AppException; // Import từ common library
import org.springframework.http.HttpStatus;

/**
 * Exception được ném ra khi cố gắng tạo một tài nguyên đã tồn tại.
 * Kế thừa từ AppException để GlobalExceptionHandler có thể bắt và xử lý.
 */
public class ResourceAlreadyExistsException extends AppException {

    public ResourceAlreadyExistsException(String resourceName, String fieldName, Object fieldValue) {
        // Gọi constructor của lớp cha với mã lỗi 409 Conflict
        super(String.format("%s already exists with %s : '%s'", resourceName, fieldName, fieldValue), HttpStatus.CONFLICT);
    }
}