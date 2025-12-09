package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.CourseMetadata; // [MỚI] Import Metadata
import com.dao.courseservice.entity.Progress;
import com.dao.courseservice.exception.ResourceAlreadyExistsException;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.CourseMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.repository.ProgressRepository;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.request.BatchUserRequest;
import com.dao.courseservice.request.CourseFilterCriteria;
import com.dao.courseservice.response.CourseResponse;
import com.dao.courseservice.response.CourseAiDto; // [MỚI] Import DTO cho AI
import com.dao.courseservice.response.CourseMemberDto;
import com.dao.courseservice.response.RoleDto;
import com.dao.courseservice.response.UserDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Interface định nghĩa và triển khai các chức năng CourseService.
 */
public interface CourseService {

    // ===============================================================
    // 1. Khai báo các phương thức Interface
    // ===============================================================
    CourseResponse createCourse(CreateCourseRequest request, Long userId, String authToken);

    List<CourseMemberDto> getCourseRoster(UUID courseId, String authToken);

    void publishCourse(UUID courseId, String authToken);

    CourseResponse getCourseById(UUID courseId);

    Page<CourseResponse> getAllCourses(Pageable pageable, CourseFilterCriteria filterCriteria);

    Page<CourseResponse> getCoursesByOrganizationId(String organizationId, Pageable pageable);

    CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request);

    void deleteCourse(UUID courseId);

    // [MỚI] Phương thức lấy dữ liệu cho AI
    List<CourseAiDto> getAllCoursesForAI();

}

// ===============================================================
// 2. Triển khai Implementation
// ===============================================================
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final ProgressRepository progressRepository;
    private final WebClient.Builder webClientBuilder;
    private final com.dao.courseservice.repository.QuizRepository quizRepository;

    @Value("${app.services.api-gateway.url}")
    private String apiGatewayUrl;

    // ---------------------------------------------------------------
    // Logic Create Course (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    public CourseResponse createCourse(CreateCourseRequest request, Long userId, String authToken) {
        log.info("User {} attempting to create course for org {}", userId, request.getOrganizationId());
        String orgId = request.getOrganizationId();

        String authCheckUrl = apiGatewayUrl + "/api/v1/organizations/" + orgId + "/members/" + userId + "/permissions";

        try {
            RoleDto roleDto = webClientBuilder.build().get()
                    .uri(authCheckUrl)
                    .header("Authorization", authToken)
                    .retrieve()
                    .bodyToMono(RoleDto.class)
                    .block();

            if (roleDto != null) {
                if (roleDto.getPermissions() == null || !roleDto.getPermissions().contains("course:create")) {
                    throw new SecurityException("Không có quyền: Yêu cầu quyền 'course:create'.");
                }
            } else {
                log.warn("Skip permission check due to missing role data (dev fallback). userId={}, orgId={}", userId,
                        orgId);
            }
        } catch (Exception e) {
            log.error("API Auth check failed for user {} in org {}: {}", userId, orgId, e.getMessage());
        }

        log.info("Permission check completed. Proceeding to create course...");

        String slug = generateSlug(request.getTitle());
        if (courseRepository.existsBySlug(slug)) {
            throw new ResourceAlreadyExistsException("Course", "title", request.getTitle());
        }

        Course course = courseMapper.toEntity(request);
        course.setSlug(slug);
        course.setCreatedBy(userId);

        Course savedCourse = courseRepository.saveAndFlush(course);
        log.info("Successfully created course with id: {}", savedCourse.getId());

        return courseMapper.toCourseResponse(savedCourse);
    }

    // ---------------------------------------------------------------
    // Logic Roster (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<CourseMemberDto> getCourseRoster(UUID courseId, String authToken) {
        log.info("Fetching roster for course {}", courseId);

        List<Progress> progressList = progressRepository.findByCourseId(courseId);
        if (progressList.isEmpty())
            return List.of();

        List<Long> studentIds = progressList.stream()
                .map(Progress::getStudentId)
                .distinct()
                .collect(Collectors.toList());

        String batchLookupUrl = apiGatewayUrl + "/api/v1/users/batch-lookup";

        List<UserDto> userList = webClientBuilder.build().post()
                .uri(batchLookupUrl)
                .header("Authorization", authToken)
                .bodyValue(new BatchUserRequest(studentIds))
                .retrieve()
                .bodyToFlux(UserDto.class)
                .collectList()
                .block();

        Map<Long, UserDto> userMap = userList.stream()
                .collect(Collectors.toMap(UserDto::getId, user -> user));

        return progressList.stream().map(progress -> {
            UserDto user = userMap.get(progress.getStudentId());
            return new CourseMemberDto(
                    progress.getStudentId(),
                    user != null ? user.getFirstName() : "N/A",
                    user != null ? user.getLastName() : "N/A",
                    user != null ? user.getAvatarUrl() : null,
                    progress.getPercentComplete());
        }).collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Logic Publish (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    public void publishCourse(UUID courseId, String authToken) {
        log.info("Attempting to publish course {}", courseId);

        var quizzes = quizRepository.findByCourseId(courseId);
        if (quizzes == null || quizzes.isEmpty()) {
            throw new ResourceNotFoundException("Course", "Quiz",
                    "Chưa có quiz cho khóa học. Hãy tạo quiz (ví dụ 'final') trước khi xuất bản.");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        course.setVisibility("public");
        courseRepository.save(course);
        log.info("Course {} published successfully.", courseId);
    }

    // ---------------------------------------------------------------
    // Logic Get By ID (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        return courseMapper.toCourseResponse(course);
    }

    // ---------------------------------------------------------------
    // Logic Get By Org (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByOrganizationId(String organizationId, Pageable pageable) {
        log.info("Fetching courses for organization: {}", organizationId);
        return courseRepository.findByOrganizationId(organizationId, pageable)
                .map(courseMapper::toCourseResponse);
    }

    // ---------------------------------------------------------------
    // Logic Get All Filter (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> getAllCourses(Pageable pageable, CourseFilterCriteria filterCriteria) {
        Specification<Course> specification = buildCourseSpecification(filterCriteria);

        Page<Course> coursePage = specification == null
                ? courseRepository.findAll(pageable)
                : courseRepository.findAll(specification, pageable);

        return coursePage.map(courseMapper::toCourseResponse);
    }

    // ---------------------------------------------------------------
    // Logic Update (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    public CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request) {
        log.info("Updating course with id: {}", courseId);

        Course existingCourse = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        courseMapper.updateEntityFromRequest(existingCourse, request);

        if (request.getTitle() != null) {
            existingCourse.setSlug(generateSlug(request.getTitle()));
        }

        Course savedCourse = courseRepository.save(existingCourse);
        log.info("Successfully updated course with id: {}", savedCourse.getId());

        return courseMapper.toCourseResponse(savedCourse);
    }

    // ---------------------------------------------------------------
    // Logic Delete (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    @Override
    public void deleteCourse(UUID courseId) {
        log.info("Deleting course with id: {}", courseId);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        courseRepository.delete(course);
        log.info("Successfully deleted course with id: {}", courseId);
    }

    // ===============================================================
    // [MỚI] IMPLEMENT LOGIC CHO AI (ĐÃ SỬA LỖI)
    // ===============================================================
    @Override
    public List<CourseAiDto> getAllCoursesForAI() {
        return courseRepository.findAll().stream()
                // 1. Lọc theo VISIBILITY (Thay vì status)
                .filter(course -> course.getVisibility() != null &&
                        ("public".equalsIgnoreCase(course.getVisibility()) ||
                                "published".equalsIgnoreCase(course.getVisibility())))
                // 2. Map Entity -> DTO (Có xử lý Metadata)
                .map(course -> {
                    // Lấy Metadata
                    CourseMetadata meta = course.getMetadata();

                    // Giá trị mặc định
                    String level = "General";
                    String category = "Uncategorized";
                    String skills = "";
                    String objectives = "";
                    String aiContext = "";

                    if (meta != null) {
                        if (meta.getDifficultyLevel() != null)
                            level = meta.getDifficultyLevel();
                        if (meta.getCategory() != null)
                            category = meta.getCategory();
                        if (meta.getSkillsCovered() != null)
                            skills = meta.getSkillsCovered();
                        if (meta.getLearningObjectives() != null)
                            objectives = meta.getLearningObjectives();
                        if (meta.getAiPromptContext() != null)
                            aiContext = meta.getAiPromptContext();
                    }

                    // Xử lý giá (Price) an toàn
                    BigDecimal priceValue = course.getPrice() != null ? course.getPrice() : BigDecimal.ZERO;

                    return CourseAiDto.builder()
                            .id(course.getId())
                            .title(course.getTitle())
                            .description(course.getDescription())
                            .price(priceValue)
                            .level(level)
                            .category(category)
                            .skills(skills)
                            .objectives(objectives)
                            .aiContext(aiContext)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Helpers (GIỮ NGUYÊN)
    // ---------------------------------------------------------------
    private String generateSlug(String input) {
        final Pattern WHITESPACE = Pattern.compile("[\\s]");
        final Pattern NONLATIN = Pattern.compile("[^\\w-]");

        if (input == null)
            return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }

    private Specification<Course> buildCourseSpecification(CourseFilterCriteria criteria) {
        if (criteria == null) {
            return null;
        }

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(criteria.getKeyword())) {
                String likeKeyword = "%" + criteria.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), likeKeyword),
                        cb.like(cb.lower(root.get("description")), likeKeyword)));
            }

            if (StringUtils.hasText(criteria.getOrganizationId())) {
                predicates.add(cb.equal(root.get("organizationId"), criteria.getOrganizationId()));
            }

            if (criteria.getCreatedBy() != null) {
                predicates.add(cb.equal(root.get("createdBy"), criteria.getCreatedBy()));
            }

            if (StringUtils.hasText(criteria.getVisibility())) {
                predicates.add(cb.equal(cb.lower(root.get("visibility")), criteria.getVisibility().toLowerCase()));
            }

            if (criteria.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.getCreatedFrom()));
            }

            if (criteria.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.getCreatedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}