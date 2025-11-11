package com.dao.examservice.controller;

import com.dao.examservice.dto.response.DeleteQuestionsByTagResponse;
import com.dao.examservice.dto.response.QuestionImportResponse;
import com.dao.examservice.dto.response.QuestionImportStatsResponse;
import com.dao.examservice.service.QuestionImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Question Import", description = "APIs for importing questions from Excel files")
public class QuestionImportController {

    private final QuestionImportService questionImportService;

    /**
     * Import questions from Excel file (.xlsx)
     * 
     * Expected Excel format:
     * Column A: STT (number)
     * Column B: Câu hỏi (question text)
     * Column C: Đáp án A
     * Column D: Đáp án B
     * Column E: Đáp án C
     * Column F: Đáp án D
     * Column G: Đáp án đúng (correct answer text or letter A/B/C/D)
     * 
     * @param file Excel file to import
     * @param subject Subject/topic of the questions (e.g., "Java", "C cơ bản")
     * @param tags Comma-separated tags (e.g., "Java,Programming" or "C,C cơ bản,Programming")
     * @return Import statistics
     */
    @PostMapping(value = "/import-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Import questions from Excel file", 
               description = "Upload an Excel file to bulk import questions. Only ADMIN users can perform this action.")
    public ResponseEntity<QuestionImportResponse> importFromExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subject") String subject,
            @RequestParam(value = "tags", required = false) String tags
    ) {
        log.info("📂 Importing questions from Excel file: {}", file.getOriginalFilename());
        log.info("   Subject: {}", subject);
        log.info("   Tags: {}", tags);

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are supported");
        }

        // Parse tags - If tags is empty, only use subject (NO auto "Programming" tag)
        String[] tagArray = (tags != null && !tags.isEmpty()) 
            ? tags.split(",") 
            : new String[]{subject};

        try {
            // Import ALL questions without checking duplicates
            Map<String, Object> result = questionImportService.importFromExcel(
                    file.getInputStream(),
                    subject,
                    tagArray,
                    false  // Always import all, never skip duplicates
            );

            log.info("✅ Import completed successfully");
            
            // Map to response DTO
            QuestionImportResponse response = new QuestionImportResponse();
            response.imported = (int) result.get("imported");
            response.skipped = (int) result.get("skipped");
            response.errors = (int) result.get("errors");
            response.errorDetails = (List<String>) result.get("errorDetails");
            response.subject = (String) result.get("subject");
            response.tags = List.of(tagArray);
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Import failed: {}", e.getMessage(), e);
            throw new RuntimeException("Import failed: " + e.getMessage(), e);
        }
    }

    /**
     * Get import statistics
     */
    @GetMapping("/import-stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get question import statistics")
    public ResponseEntity<QuestionImportStatsResponse> getImportStats() {
        Map<String, Object> stats = questionImportService.getImportStatistics();
        
        QuestionImportStatsResponse response = new QuestionImportStatsResponse();
        response.totalQuestions = (long) stats.get("totalQuestions");
        response.totalTags = (int) stats.get("totalTags");
        response.questionsByTag = (Map<String, Long>) stats.get("questionsByTag");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete all questions by tag
     */
    @DeleteMapping("/by-tag/{tag}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete all questions with specific tag")
    public ResponseEntity<DeleteQuestionsByTagResponse> deleteByTag(@PathVariable String tag) {
        log.info("🗑️ Deleting all questions with tag: {}", tag);
        
        int deletedCount = questionImportService.deleteByTag(tag);
        
        DeleteQuestionsByTagResponse response = new DeleteQuestionsByTagResponse();
        response.deletedCount = deletedCount;
        response.tag = tag;
        response.message = String.format("Deleted %d questions with tag '%s'", deletedCount, tag);
        
        return ResponseEntity.ok(response);
    }
}

