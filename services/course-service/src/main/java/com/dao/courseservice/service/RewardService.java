package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.Reward;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.RewardMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.repository.RewardRepository;
import com.dao.courseservice.request.TokenGrantRequest;
import com.dao.courseservice.response.RewardResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public interface RewardService {
    void grantReward(UUID studentId, int tokens, String reason, UUID relatedId, UUID courseId);
    List<RewardResponse> getRewardsForStudent(UUID studentId);
}

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class RewardServiceImpl implements RewardService {

    private final RewardRepository rewardRepository;
    private final CourseRepository courseRepository;
    private final RewardMapper rewardMapper;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.services.token-reward.url:http://localhost:3001}")
    private String tokenRewardBaseUrl;

    @Value("${app.services.token-reward.api-key:}")
    private String tokenRewardApiKey;

    @Override
    public void grantReward(UUID studentId, int tokens, String reason, UUID relatedId, UUID courseId) {
        log.info("Granting {} tokens to student {} for reason: {}", tokens, studentId, reason);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Reward reward = Reward.builder()
                .studentId(studentId)
                .course(course)
                .tokensAwarded(tokens)
                .reasonCode(reason)
                .relatedId(relatedId != null ? relatedId.toString() : null)
                .build();

        rewardRepository.save(reward);
        log.info("Reward saved successfully for student {}", studentId);

        TokenGrantRequest requestPayload = TokenGrantRequest.builder()
                .studentId(studentId)
                .amount(tokens)
                .reasonCode(reason)
                .relatedId(relatedId)
                .courseId(courseId)
                .build();
        dispatchToTokenRewardService(requestPayload);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RewardResponse> getRewardsForStudent(UUID studentId) {
        log.info("Fetching rewards for student {}", studentId);

        return rewardRepository.findByStudentIdOrderByAwardedAtDesc(studentId).stream()
                .map(rewardMapper::toRewardResponse)
                .collect(Collectors.toList());
    }

    private void dispatchToTokenRewardService(TokenGrantRequest requestPayload) {
        String targetUrl = tokenRewardBaseUrl + "/api/tokens/grant";
        try {
            WebClient.RequestBodySpec requestSpec = webClientBuilder.build().post()
                    .uri(targetUrl)
                    .header("Content-Type", "application/json");

            if (StringUtils.hasText(tokenRewardApiKey)) {
                requestSpec.header("Authorization", "Bearer " + tokenRewardApiKey);
            }

            requestSpec.bodyValue(requestPayload)
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(Duration.ofSeconds(5))
                    .block();

            log.info("Dispatched token reward to {} for student {}", targetUrl, requestPayload.getStudentId());
        } catch (WebClientResponseException ex) {
            log.warn("Token reward service rejected request (status {}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        } catch (WebClientRequestException ex) {
            log.warn("Unable to reach token reward service at {}: {}", targetUrl, ex.getMessage());
        }
    }
}
