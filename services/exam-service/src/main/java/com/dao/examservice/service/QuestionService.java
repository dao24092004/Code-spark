package com.dao.examservice.service;

import com.dao.examservice.dto.request.QuestionCreationRequest;
import com.dao.examservice.dto.request.QuestionSearchRequest;
import com.dao.examservice.entity.Question;
import com.dao.examservice.repository.QuestionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Transactional
    public Question create(QuestionCreationRequest request) {
        Question q = new Question();
        q.setType(request.type);
        q.setContent(request.content);
        q.setDifficulty(request.difficulty);
        q.setExplanation(request.explanation);
        q.setScore(request.score);
        q.setText(request.text);
        if (request.tags != null) q.setTags(request.tags);
        return questionRepository.save(q);
    }

    @Transactional(readOnly = true)
    public List<Question> search(QuestionSearchRequest request) {
        List<String> tags = request.tags == null ? Collections.emptyList() : new ArrayList<>(request.tags);
        return questionRepository.search(tags, tags.isEmpty(), request.minDifficulty, request.maxDifficulty);
    }

    /**
     * Generate random unique question IDs based on filter criteria.
     * Đảm bảo không trả về câu hỏi trùng lặp: so sánh theo trường JSON "content".
     * 
     * @param request Filter criteria (tags, difficulty, count)
     * @return List of unique random question IDs
     * @throws IllegalArgumentException if not enough unique questions available
     */
    @Transactional(readOnly = true)
    public List<UUID> generateRandomIds(com.dao.examservice.dto.request.GenerateQuestionsRequest request) {
        QuestionSearchRequest filter = new QuestionSearchRequest();
        filter.tags = request.tags;
        filter.minDifficulty = request.minDifficulty;
        filter.maxDifficulty = request.maxDifficulty;

        List<Question> pool = search(filter);

        if (pool == null || pool.isEmpty() || request.count <= 0) {
            return Collections.emptyList();
        }

        // ✅ Loại trùng dựa trên nội dung JSON "content"
        Set<String> seenContents = new HashSet<>();
        List<Question> uniqueQuestions = new ArrayList<>();
        
        for (Question q : pool) {
            String normalizedContent = normalizeQuestionContent(q.getContent());
            if (normalizedContent == null || seenContents.add(normalizedContent)) {
                uniqueQuestions.add(q);
            }
        }

        // ✅ Validate we have enough unique questions
        if (uniqueQuestions.size() < request.count) {
            throw new IllegalArgumentException(
                String.format(
                    "Not enough unique questions available. Requested: %d, Available: %d (after removing %d duplicates). " +
                    "Please adjust filter criteria (tags: %s, difficulty: %d-%d)",
                    request.count,
                    uniqueQuestions.size(),
                    pool.size() - uniqueQuestions.size(),
                    request.tags,
                    request.minDifficulty,
                    request.maxDifficulty
                )
            );
        }

        // ✅ Shuffle and select random questions
        Collections.shuffle(uniqueQuestions);
        List<UUID> result = uniqueQuestions.stream()
                .limit(request.count)
                .map(Question::getId)
                .collect(Collectors.toList());
        
        return result;
    }

    private static final int QUESTION_PREFIX_LENGTH = 20;
    private static final int OPTION_PREFIX_LENGTH = 15;

    private String normalizeQuestionContent(String content) {
        if (content == null) {
            return null;
        }

        try {
            JsonNode node = OBJECT_MAPPER.readTree(content);
            String questionKey = takePrefix(node.path("question").asText(null), QUESTION_PREFIX_LENGTH);

            List<String> optionKeys = new ArrayList<>();
            JsonNode optionsNode = node.path("options");
            if (optionsNode.isArray()) {
                for (JsonNode optionNode : optionsNode) {
                    if (optionNode.isTextual()) {
                        String optionKey = takePrefix(optionNode.asText(), OPTION_PREFIX_LENGTH);
                        if (optionKey != null) {
                            optionKeys.add(optionKey);
                        }
                    }
                }
            }

            if (questionKey == null && optionKeys.isEmpty()) {
                return takePrefix(content, QUESTION_PREFIX_LENGTH * 2);
            }

            int correctAnswerIndex = node.path("correctAnswer").isInt() ? node.path("correctAnswer").asInt() : -1;

            StringBuilder keyBuilder = new StringBuilder();
            if (questionKey != null) {
                keyBuilder.append("q:").append(questionKey);
            }
            if (!optionKeys.isEmpty()) {
                if (keyBuilder.length() > 0) {
                    keyBuilder.append("|");
                }
                keyBuilder.append("o:").append(String.join("|", optionKeys));
            }
            keyBuilder.append("|a:").append(correctAnswerIndex);

            return keyBuilder.toString();
        } catch (JsonProcessingException ex) {
            return takePrefix(content, QUESTION_PREFIX_LENGTH * 2);
        }
    }

    private String takePrefix(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    @Transactional
    public void delete(UUID id) {
        questionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<String> getAllSubjects() {
        return questionRepository.findAllUniqueTags();
    }
}


