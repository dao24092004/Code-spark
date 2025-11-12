package com.dao.examservice.service;

import com.dao.examservice.entity.Question;
import com.dao.examservice.repository.QuestionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Import questions from Excel file
     * 
     * Expected Excel format:
     * Column A (0): STT (number)
     * Column B (1): Câu hỏi (question text)
     * Column C (2): Đáp án A
     * Column D (3): Đáp án B
     * Column E (4): Đáp án C
     * Column F (5): Đáp án D
     * Column G (6): Đáp án đúng (correct answer)
     * 
     * @param inputStream Excel file input stream
     * @param subject Subject/topic name
     * @param tags Array of tags to apply to all questions
     * @param skipDuplicates If true, skip duplicate questions; if false, import all
     * @return Import statistics
     */
    @Transactional
    public Map<String, Object> importFromExcel(InputStream inputStream, String subject, String[] tags, boolean skipDuplicates) {
        log.info("🔄 Starting import from Excel...");
        log.info("   Subject: {}", subject);
        log.info("   Tags: {}", Arrays.toString(tags));
        log.info("   Skip Duplicates: {}", skipDuplicates);

        int importedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            
            log.info("📄 Processing sheet: {} ({} rows)", 
                    sheet.getSheetName(), 
                    sheet.getLastRowNum());

            // Skip header row (start from row 1)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                
                if (row == null) {
                    skippedCount++;
                    continue;
                }

                try {
                    Question question = parseRow(row, subject, tags);
                    
                    if (question == null) {
                        skippedCount++;
                        continue;
                    }

                    // Check for duplicate content (only if skipDuplicates is true)
                    if (skipDuplicates && isDuplicateContent(question.getText())) {
                        log.warn("⚠️  Row {}: Duplicate question content found, skipping", i + 1);
                        skippedCount++;
                        continue;
                    }

                    questionRepository.save(question);
                    importedCount++;

                    if (importedCount % 50 == 0) {
                        log.info("   ✅ Imported {} questions...", importedCount);
                    }

                } catch (Exception e) {
                    errorCount++;
                    String error = String.format("Row %d: %s", i + 1, e.getMessage());
                    errors.add(error);
                    log.error("❌ {}", error);
                }
            }

        } catch (Exception e) {
            log.error("❌ Fatal error during import: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }

        log.info("✅ Import completed!");
        log.info("   Imported: {}", importedCount);
        log.info("   Skipped: {}", skippedCount);
        log.info("   Errors: {}", errorCount);

        Map<String, Object> result = new HashMap<>();
        result.put("imported", importedCount);
        result.put("skipped", skippedCount);
        result.put("errors", errorCount);
        result.put("errorDetails", errors);
        result.put("subject", subject);
        result.put("tags", tags);

        return result;
    }

    /**
     * Parse a single Excel row into a Question entity
     */
    private Question parseRow(Row row, String subject, String[] tags) {
        // Check if row is empty or header
        Cell questionCell = row.getCell(1);
        if (questionCell == null || isEmptyOrHeader(questionCell)) {
            return null;
        }

        try {
            // Extract values
            String questionText = getCellValueAsString(questionCell).trim();
            String optionA = getCellValueAsString(row.getCell(2)).trim();
            String optionB = getCellValueAsString(row.getCell(3)).trim();
            String optionC = getCellValueAsString(row.getCell(4)).trim();
            String optionD = getCellValueAsString(row.getCell(5)).trim();
            String correctAnswerRaw = getCellValueAsString(row.getCell(6)).trim();

            // Validate required fields
            if (questionText.isEmpty() || correctAnswerRaw.isEmpty()) {
                return null;
            }

            // Build options array
            List<String> options = Arrays.asList(optionA, optionB, optionC, optionD);

            // Determine correct answer index
            int correctIndex = determineCorrectAnswerIndex(correctAnswerRaw, options);

            // Build content JSON
            Map<String, Object> content = new HashMap<>();
            content.put("question", questionText);
            content.put("options", options);
            content.put("correctAnswer", correctIndex);

            // Create Question entity
            Question question = new Question();
            question.setType(Question.QuestionType.SINGLE_CHOICE);
            question.setText(questionText);
            question.setContent(objectMapper.writeValueAsString(content));
            question.setDifficulty(5); // Default medium difficulty
            question.setExplanation(null);
            question.setScore(10); // Default score
            
            // ✅ Use LinkedHashSet to preserve order and avoid duplicate tags
            Set<String> uniqueTags = new LinkedHashSet<>(Arrays.asList(tags));
            question.setTags(uniqueTags);

            return question;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse row: " + e.getMessage(), e);
        }
    }

    /**
     * Determine correct answer index from raw answer value
     */
    private int determineCorrectAnswerIndex(String correctAnswerRaw, List<String> options) {
        String upper = correctAnswerRaw.toUpperCase().trim();

        // Strategy 1: Check if it's a single letter (A/B/C/D)
        if (upper.matches("^[ABCD]$")) {
            return upper.charAt(0) - 'A'; // A=0, B=1, C=2, D=3
        }

        // Strategy 2: Exact match with options
        for (int i = 0; i < options.size(); i++) {
            if (options.get(i).equalsIgnoreCase(correctAnswerRaw)) {
                return i;
            }
        }

        // Strategy 3: Partial match (contains)
        for (int i = 0; i < options.size(); i++) {
            String option = options.get(i).toLowerCase();
            String answer = correctAnswerRaw.toLowerCase();
            if (option.contains(answer) || answer.contains(option)) {
                return i;
            }
        }

        // Default to A if no match found
        log.warn("⚠️  Could not match correct answer '{}' to any option, defaulting to A", correctAnswerRaw);
        return 0;
    }

    /**
     * Check if question content already exists in database (case-insensitive)
     * This prevents duplicate questions with same text
     */
    private boolean isDuplicateContent(String questionText) {
        if (questionText == null || questionText.isBlank()) {
            return false;
        }
        
        // Use repository method for efficient database query (case-insensitive)
        List<Question> existingQuestions = questionRepository.findByTextIgnoreCase(questionText.trim());
        return !existingQuestions.isEmpty();
    }

    /**
     * Get cell value as string, handling different cell types
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                } else {
                    // Format number without scientific notation
                    yield String.format("%.0f", cell.getNumericCellValue());
                }
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            case BLANK -> "";
            default -> "";
        };
    }

    /**
     * Check if cell is empty or contains header text
     */
    private boolean isEmptyOrHeader(Cell cell) {
        String value = getCellValueAsString(cell).toLowerCase().trim();
        return value.isEmpty() || 
               value.equals("câu hỏi") || 
               value.equals("question") || 
               value.equals("stt");
    }

    /**
     * Get import statistics (total questions by tag)
     */
    public Map<String, Object> getImportStatistics() {
        List<String> allTags = questionRepository.findAllUniqueTags();
        Map<String, Long> tagCounts = new HashMap<>();

        for (String tag : allTags) {
            long count = questionRepository.findAll().stream()
                    .filter(q -> q.getTags() != null && q.getTags().contains(tag))
                    .count();
            tagCounts.put(tag, count);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalQuestions", questionRepository.count());
        stats.put("totalTags", allTags.size());
        stats.put("questionsByTag", tagCounts);

        return stats;
    }

    /**
     * Delete all questions with specific tag
     * @param tag Tag name to delete
     * @return Number of questions deleted
     */
    @Transactional
    public int deleteByTag(String tag) {
        log.info("🗑️ Deleting questions with tag: {}", tag);
        
        // Find all questions with this tag
        List<Question> questionsToDelete = questionRepository.findAll().stream()
                .filter(q -> q.getTags() != null && q.getTags().contains(tag))
                .toList();
        
        int count = questionsToDelete.size();
        log.info("   Found {} questions to delete", count);
        
        if (count > 0) {
            // Delete all questions (cascade will delete tags)
            questionRepository.deleteAll(questionsToDelete);
            log.info("✅ Deleted {} questions with tag '{}'", count, tag);
        } else {
            log.warn("⚠️  No questions found with tag '{}'", tag);
        }
        
        return count;
    }
}

