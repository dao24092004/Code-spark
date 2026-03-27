package com.dao.examservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Service sử dụng Spring AI để chấm điểm tự động câu hỏi tự luận (ESSAY).
 * Sử dụng AI để đánh giá câu trả lời của học sinh dựa trên câu hỏi và đáp án mẫu.
 */
@Service
@ConditionalOnProperty(name = "spring.ai.openai.api-key")
public class EssayScoringService {

    private static final Logger log = LoggerFactory.getLogger(EssayScoringService.class);

    private static final int MAX_QUESTION_LENGTH = 5000;
    private static final int MAX_ANSWER_LENGTH = 10000;
    
    private static final Pattern DANGEROUS_PATTERN = Pattern.compile(
        "(?i)(javascript:|data:|vbscript:|on\\w+=|<script|</script|iframe|object|embed)",
        Pattern.CASE_INSENSITIVE
    );

    private final ChatClient chatClient;

    public EssayScoringService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * Chấm điểm câu trả lời ESSAY tự động bằng AI.
     */
    public EssayScoreResult scoreEssay(
            String questionContent,
            String studentAnswer,
            int maxScore,
            String gradingCriteria) {

        // Sanitize inputs
        String sanitizedQuestion = sanitizeInput(questionContent, MAX_QUESTION_LENGTH);
        String sanitizedAnswer = sanitizeInput(studentAnswer, MAX_ANSWER_LENGTH);
        String sanitizedCriteria = sanitizeInput(gradingCriteria, 1000);

        validateInputs(sanitizedQuestion, sanitizedAnswer, maxScore);

        String systemMessage = """
            Bạn là một giáo viên chấm bài tự luận chuyên nghiệp.
            Nhiệm vụ của bạn là chấm điểm câu trả lời của học sinh một cách công bằng và chính xác.
            
            Hãy chấm điểm dựa trên các tiêu chí sau:
            1. Độ chính xác của nội dung
            2. Mức độ đầy đủ của câu trả lời
            3. Khả năng phân tích và lập luận
            4. Cách diễn đạt và trình bày
            
            Trả về kết quả theo định dạng JSON như sau:
            {
                "score": <điểm số từ 0 đến {maxScore}>,
                "feedback": "<nhận xét chi tiết>",
                "strengths": "<điểm mạnh của câu trả lời>",
                "improvements": "<điểm cần cải thiện>"
            }
            
            Chỉ trả về JSON, không giải thích thêm.
            """;

        String userMessage = String.format("""
            Câu hỏi: %s
            
            Câu trả lời của học sinh: %s
            
            Điểm tối đa: %d
            
            %s
            """,
            sanitizedQuestion,
            sanitizedAnswer,
            maxScore,
            sanitizedCriteria != null ? "Tiêu chí chấm điểm bổ sung: " + sanitizedCriteria : ""
        );

        try {
            String result = chatClient.prompt()
                    .system(systemMessage.replace("{maxScore}", String.valueOf(maxScore)))
                    .user(userMessage)
                    .call()
                    .content();
            return parseScoreResult(result, maxScore);
        } catch (Exception e) {
            log.error("Error scoring essay with AI: {}", e.getMessage(), e);
            return new EssayScoreResult(0,
                "Không thể chấm điểm tự động do lỗi hệ thống. Vui lòng chấm thủ công.",
                "",
                "");
        }
    }

    /**
     * Sanitize user input to prevent prompt injection and XSS attacks.
     */
    private String sanitizeInput(String input, int maxLength) {
        if (input == null) {
            return "";
        }

        // Check for dangerous patterns
        if (DANGEROUS_PATTERN.matcher(input).find()) {
            log.warn("Potentially dangerous input detected and sanitized");
            input = input.replaceAll(DANGEROUS_PATTERN.pattern(), "");
        }

        // Trim and limit length
        String sanitized = input.trim();
        
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
            log.warn("Input truncated to {} characters", maxLength);
        }

        return sanitized;
    }

    /**
     * Validate inputs before processing.
     */
    private void validateInputs(String question, String answer, int maxScore) {
        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("Question content is required");
        }
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("Student answer is required");
        }
        if (maxScore <= 0) {
            throw new IllegalArgumentException("Max score must be greater than 0");
        }
        if (maxScore > 1000) {
            throw new IllegalArgumentException("Max score cannot exceed 1000");
        }
    }

    /**
     * Parse kết quả từ AI response.
     */
    private EssayScoreResult parseScoreResult(String aiResponse, int maxScore) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return new EssayScoreResult(0,
                "Không thể chấm điểm tự động. Vui lòng chấm thủ công.",
                "",
                "");
        }

        try {
            // Simple JSON parsing
            int scoreStart = aiResponse.indexOf("\"score\"");
            if (scoreStart == -1) {
                return new EssayScoreResult(0,
                    "Không thể chấm điểm tự động. Vui lòng chấm thủ công.",
                    "",
                    "");
            }
            
            int scoreEnd = aiResponse.indexOf(",", scoreStart);
            if (scoreEnd == -1) {
                scoreEnd = aiResponse.indexOf("}", scoreStart);
            }
            
            String scoreStr = aiResponse.substring(scoreStart + 7, scoreEnd).replaceAll("[^0-9-]", "");
            int score;
            try {
                score = Integer.parseInt(scoreStr.trim());
            } catch (NumberFormatException e) {
                score = 0;
            }
            score = Math.min(Math.max(score, 0), maxScore);

            // Extract feedback
            String feedback = extractJsonField(aiResponse, "feedback");
            String strengths = extractJsonField(aiResponse, "strengths");
            String improvements = extractJsonField(aiResponse, "improvements");

            return new EssayScoreResult(score, feedback, strengths, improvements);
        } catch (Exception e) {
            log.error("Error parsing AI score result: {}", e.getMessage());
            return new EssayScoreResult(0,
                "Không thể chấm điểm tự động. Vui lòng chấm thủ công.",
                "",
                "");
        }
    }

    private String extractJsonField(String json, String field) {
        try {
            int fieldStart = json.indexOf("\"" + field + "\"");
            if (fieldStart == -1) return "";
            int valueStart = json.indexOf(":", fieldStart) + 1;
            int valueEnd = json.indexOf(",", valueStart);
            if (valueEnd == -1) {
                valueEnd = json.indexOf("}", valueStart);
            }
            String value = json.substring(valueStart, valueEnd).trim();
            return value.replaceAll("^\"|\"$", "").replace("\\\"", "\"");
        } catch (Exception e) {
            return "";
        }
    }

    public record EssayScoreResult(
        int score,
        String feedback,
        String strengths,
        String improvements
    ) {}
}
