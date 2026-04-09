package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.Progress;
import com.dao.courseservice.exception.ResourceAlreadyExistsException;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.CourseMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.repository.ProgressRepository;
import com.dao.courseservice.repository.QuizSubmissionRepository;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.request.CourseFilterCriteria;
import com.dao.courseservice.response.CourseResponse;
import com.dao.courseservice.response.CourseMemberDto;
import com.dao.courseservice.response.UserDto;
import com.dao.common.notification.NotificationMessage;
import com.dao.common.notification.NotificationProducerService;
import com.dao.courseservice.client.IdentityServiceClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Predicate;

public interface CourseService {

    CourseResponse createCourse(CreateCourseRequest request, UUID userId, String authToken);

    List<CourseMemberDto> getCourseRoster(UUID courseId, String authToken);

    void publishCourse(UUID courseId, String authToken);

    CourseResponse getCourseById(UUID courseId);

    Page<CourseResponse> getAllCourses(Pageable pageable, CourseFilterCriteria filterCriteria);

    Page<CourseResponse> getCoursesByOrganizationId(UUID organizationId, Pageable pageable);

    CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request);

    void deleteCourse(UUID courseId);

    Page<CourseMemberDto> getCourseStudents(UUID courseId, Pageable pageable);
}

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final ProgressRepository progressRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final IdentityServiceClient identityServiceClient;
    private final com.dao.courseservice.repository.QuizRepository quizRepository;
    private final WebClient.Builder webClientBuilder;
    private final NotificationProducerService notificationService;

    @Value("${app.services.api-gateway.url}")
    private String apiGatewayUrl;

    @Override
    public CourseResponse createCourse(CreateCourseRequest request, UUID userId, String authToken) {
        log.info("User {} attempting to create course for org {}", userId, request.getOrganizationId());
        UUID orgId = request.getOrganizationId();

        String authCheckUrl = apiGatewayUrl + "/api/v1/organizations/" + orgId + "/members/" + userId + "/permissions";

        try {
            var roleDto = webClientBuilder.build().get()
                    .uri(authCheckUrl)
                    .header("Authorization", authToken)
                    .retrieve()
                    .bodyToMono(com.dao.courseservice.response.RoleDto.class)
                    .block();

            if (roleDto != null) {
                if (roleDto.getPermissions() == null || !roleDto.getPermissions().contains("course:create")) {
                    throw new SecurityException("Khong co quyen: Yeu cau quyen 'course:create'.");
                }
            }
        } catch (Exception e) {
            log.warn("Skip permission check due to missing role data (dev fallback). userId={}, orgId={}: {}",
                    userId, orgId, e.getMessage());
        }

        String slug = generateSlug(request.getTitle());
        if (courseRepository.existsActiveBySlug(slug)) {
            throw new ResourceAlreadyExistsException("Course", "title", request.getTitle());
        }

        Course course = courseMapper.toEntity(request);
        course.setSlug(slug);
        course.setCreatedBy(userId);

        Course savedCourse = courseRepository.saveAndFlush(course);
        log.info("Successfully created course with id: {}", savedCourse.getId());
        NotificationMessage msg = new NotificationMessage();
        msg.setRecipientUserId(userId.toString());
        msg.setTitle("Course Created");
        msg.setContent("Your course '" + savedCourse.getTitle() + "' has been created successfully.");
        msg.setType("INFO");
        msg.setSeverity("low");
        notificationService.sendNotification(msg);

        return courseMapper.toCourseResponse(savedCourse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseMemberDto> getCourseRoster(UUID courseId, String authToken) {
        log.info("Fetching roster for course {}", courseId);

        List<Progress> progressList = progressRepository.findByCourseId(courseId);
        if (progressList.isEmpty())
            return List.of();

        List<UUID> userIds = progressList.stream()
                .map(Progress::getStudentId)
                .distinct()
                .collect(Collectors.toList());

        List<UserDto> userList = identityServiceClient.getUsersByIds(userIds);

        Map<UUID, UserDto> userMap = userList.stream()
                .collect(Collectors.toMap(UserDto::getId, user -> user));

        return progressList.stream().map(progress -> {
            UserDto user = userMap.get(progress.getStudentId());
            return new CourseMemberDto(
                    progress.getStudentId(),
                    user != null ? user.getFirstName() : "N/A",
                    user != null ? user.getLastName() : "N/A",
                    user != null ? user.getAvatarUrl() : null,
                    user != null ? user.getEmail() : null,
                    progress.getPercentComplete());
        }).collect(Collectors.toList());
    }

    @Override
    public void publishCourse(UUID courseId, String authToken) {
        log.info("Attempting to publish course {}", courseId);

        var quizzes = quizRepository.findByCourseId(courseId);
        if (quizzes == null || quizzes.isEmpty()) {
            throw new ResourceNotFoundException("Course", "Quiz",
                    "Chua co quiz cho khoa hoc. Hay tao quiz truoc khi xuat ban.");
        }

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        course.setVisibility("PUBLIC");
        courseRepository.save(course);
        log.info("Course {} published successfully.", courseId);

        NotificationMessage msg = new NotificationMessage();
        msg.setRecipientUserId("ALL_STUDENTS"); 
        
        msg.setTitle("Khóa học mới mở!");
        msg.setContent("Khóa học '" + course.getTitle() + "' vừa được mở. Vào học ngay!");
        msg.setType("INFO");
        msg.setSeverity("high"); 
        
        // Gửi kèm ID khóa học để Frontend làm chức năng click vào thông báo -> chuyển hướng đến khóa học
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("courseId", course.getId().toString());
        msg.setData(extraData);

        notificationService.sendNotification(msg);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "courseDetails", key = "#courseId")
    public CourseResponse getCourseById(UUID courseId) {
        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        return courseMapper.toCourseResponse(course);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByOrganizationId(UUID organizationId, Pageable pageable) {
        log.info("Fetching courses for organization: {}", organizationId);
        return courseRepository.findByOrganizationId(organizationId, pageable)
                .map(courseMapper::toCourseResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "courses", key = "#filterCriteria.hashCode() + '-' + #pageable.pageNumber")
    public Page<CourseResponse> getAllCourses(Pageable pageable, CourseFilterCriteria filterCriteria) {
        Specification<Course> spec = buildCourseSpecification(filterCriteria);
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);
        return coursePage.map(courseMapper::toCourseResponse);
    }

    @Override
    @CacheEvict(value = { "courses", "courseDetails", "popularCourses" }, allEntries = true)
    public CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request) {
        log.info("Updating course with id: {}", courseId);

        Course existingCourse = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        courseMapper.updateEntityFromRequest(existingCourse, request);

        if (request.getTitle() != null) {
            existingCourse.setSlug(generateSlug(request.getTitle()));
        }

        Course savedCourse = courseRepository.save(existingCourse);
        log.info("Successfully updated course with id: {}", savedCourse.getId());

        return courseMapper.toCourseResponse(savedCourse);
    }

    @Override
    @CacheEvict(value = { "courses", "courseDetails", "popularCourses" }, allEntries = true)
    public void deleteCourse(UUID courseId) {
        log.info("Deleting course with id: {}", courseId);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        courseRepository.delete(course);

        log.info("Successfully deleted course with id: {}", courseId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseMemberDto> getCourseStudents(UUID courseId, Pageable pageable) {
        log.info("Fetching students for course {} with pagination", courseId);

        courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Page<Progress> progressPage = progressRepository.findByCourseId(courseId, pageable);

        if (progressPage.isEmpty()) {
            return Page.empty(pageable);
        }

        List<UUID> userIds = progressPage.getContent().stream()
                .map(Progress::getStudentId)
                .distinct()
                .collect(Collectors.toList());

        List<UserDto> userList = identityServiceClient.getUsersByIds(userIds);
        Map<UUID, UserDto> userMap = userList.stream()
                .collect(Collectors.toMap(UserDto::getId, user -> user));

        List<CourseMemberDto> members = progressPage.getContent().stream()
                .map(progress -> {
                    UserDto user = userMap.get(progress.getStudentId());
                    return new CourseMemberDto(
                            progress.getStudentId(),
                            user != null ? user.getFirstName() : "N/A",
                            user != null ? user.getLastName() : "N/A",
                            user != null ? user.getAvatarUrl() : null,
                            user != null ? user.getEmail() : null,
                            progress.getPercentComplete());
                })
                .collect(Collectors.toList());

        return new PageImpl<>(members, pageable, progressPage.getTotalElements());
    }

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
            return Specification.where(null);
        }

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(criteria.getKeyword())) {
                String likeKeyword = "%" + criteria.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), likeKeyword),
                        cb.like(cb.lower(root.get("description")), likeKeyword)));
            }

            if (criteria.getOrganizationId() != null) {
                predicates.add(cb.equal(root.get("organizationId"), criteria.getOrganizationId()));
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
