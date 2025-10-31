package com.dao.courseservice.request;

import jakarta.validation.constraints.NotBlank;
// Bỏ @Data, chỉ dùng @Getter/@Setter cho 'content'
import lombok.Getter;
import lombok.Setter;

// Chỉ dùng @Getter/@Setter cho các biến không phải 'isCorrect'
@Getter
@Setter
public class CreateOptionRequest {
    
    @NotBlank(message = "Option content cannot be blank")
    private String content;
    
    private boolean isCorrect = false;

    // ====================================================================
    // [THÊM MỚI] - SỬA LỖI TẬN GỐC
    // Chúng ta sẽ tự viết setter và getter cho 'isCorrect'
    // để Jackson và Mapper gọi chính xác.
    // ====================================================================

    /**
     * Thư viện Jackson (JSON) sẽ tìm setter tên "setIsCorrect" 
     * khi nó thấy key "isCorrect" trong JSON.
     * Chúng ta viết tường minh ra đây.
     */
    public void setIsCorrect(boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    /**
     * Mapper (khi gọi oDto.isCorrect()) sẽ tìm getter tên "isCorrect".
     * Chúng ta viết tường minh ra đây.
     */
    public boolean isCorrect() {
        return this.isCorrect;
    }
}

