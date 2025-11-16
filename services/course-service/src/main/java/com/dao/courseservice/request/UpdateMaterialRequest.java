package com.dao.courseservice.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cập nhật học liệu. Các trường đều tùy chọn.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateMaterialRequest {
    private String title;
    private String type;
    private String storageKey;
    private String content;
    private Integer displayOrder;
}


