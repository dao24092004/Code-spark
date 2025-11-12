package com.dao.examservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic DTO for enum/lookup table responses
 * Used for: exam types, difficulties, statuses, etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnumOptionResponse {
    
    /**
     * Unique code (e.g., "practice", "easy", "draft")
     */
    private String code;
    
    /**
     * English label for display
     */
    private String label;
    
    /**
     * Vietnamese label for display
     */
    private String labelVi;
    
    /**
     * Optional description
     */
    private String description;
    
    /**
     * Display order in dropdowns
     */
    private Integer displayOrder;

    /**
     * Convenience constructor for simple options
     */
    public EnumOptionResponse(String code, String label, String labelVi) {
        this.code = code;
        this.label = label;
        this.labelVi = labelVi;
        this.displayOrder = 0;
    }
}

