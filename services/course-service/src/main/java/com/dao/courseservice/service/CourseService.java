package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.exception.ResourceAlreadyExistsException;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.CourseMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.response.CourseResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

//================================================================================
// 1. INTERFACE: Định nghĩa các chức năng mà service sẽ cung cấp
//================================================================================

public interface CourseService {
    CourseResponse createCourse(CreateCourseRequest request);
    CourseResponse getCourseById(UUID courseId);
    Page<CourseResponse> getAllCourses(Pageable pageable);
    CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request);
    void deleteCourse(UUID courseId);
}

//================================================================================
// 2. IMPLEMENTATION: Lớp triển khai logic cho các chức năng trên
//================================================================================

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper; // Giả sử bạn có một lớp Mapper

    @Override
    public CourseResponse createCourse(CreateCourseRequest request) {
        log.info("Creating new course with ID: {}", request.getId());

        // 1. (MỚI) Kiểm tra xem ID người dùng cung cấp đã tồn tại chưa
        if (courseRepository.existsById(request.getId())) {
            throw new ResourceAlreadyExistsException("Course", "id", request.getId());
        }

        // 2. Kiểm tra slug (giữ nguyên logic cũ)
        String slug = generateSlug(request.getTitle());
        if (courseRepository.existsBySlug(slug)) {
            throw new ResourceAlreadyExistsException("Course", "title", request.getTitle());
        }

        // 3. Chuyển đổi từ request sang entity (mapper sẽ gán cả ID)
        Course course = courseMapper.toEntity(request);
        course.setSlug(slug);

        // 4. (THAY ĐỔI) Dùng saveAndFlush() để lấy ngay lập tức createdAt/updatedAt
        Course savedCourse = courseRepository.saveAndFlush(course);
        
        log.info("Successfully created course with id: {}", savedCourse.getId());
        
        return courseMapper.toCourseResponse(savedCourse);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        return courseMapper.toCourseResponse(course);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable)
                .map(courseMapper::toCourseResponse);
    }

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

    @Override
    public void deleteCourse(UUID courseId) {
        log.info("Deleting course with id: {}", courseId);
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }
        courseRepository.deleteById(courseId);
        log.info("Successfully deleted course with id: {}", courseId);
    }
    
    private String generateSlug(String input) {
        final Pattern WHITESPACE = Pattern.compile("[\\s]");
        final Pattern NONLATIN = Pattern.compile("[^\\w-]");
        
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}