package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.Material;
import com.dao.courseservice.entity.Progress;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.ProgressMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.repository.MaterialRepository;
import com.dao.courseservice.repository.ProgressRepository;
import com.dao.courseservice.response.ProgressResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

//================================================================================
// 1. INTERFACE: Định nghĩa các chức năng nghiệp vụ cho việc Theo dõi tiến độ (UC33)
//================================================================================

/**
 * Interface định nghĩa các chức năng nghiệp vụ cho việc Theo dõi tiến độ (UC33).
 */
public interface ProgressService {

    /**
     * Cập nhật tiến độ của học sinh khi họ hoàn thành một học liệu.
     * @param studentId ID của học sinh.
     * @param courseId ID của khóa học.
     * @param materialId ID của học liệu vừa hoàn thành.
     * @return Dữ liệu tiến độ đã được cập nhật.
     */
    ProgressResponse updateStudentProgress(Long studentId, UUID courseId, UUID materialId);

    /**
     * Lấy thông tin tiến độ của một học sinh trong một khóa học.
     * @param studentId ID của học sinh.
     * @param courseId ID của khóa học.
     * @return Dữ liệu tiến độ.
     */
    ProgressResponse getStudentProgressInCourse(Long studentId, UUID courseId);

    /**
     * Lấy dashboard tiến độ của tất cả học sinh trong một khóa học (dành cho giảng viên).
     * @param courseId ID của khóa học.
     * @return Danh sách tiến độ của tất cả học sinh.
     */
    List<ProgressResponse> getCourseProgressDashboard(UUID courseId);
}

//================================================================================
// 2. IMPLEMENTATION: Lớp triển khai logic cho các chức năng trên
//================================================================================

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class ProgressServiceImpl implements ProgressService {

    private final ProgressRepository progressRepository;
    private final CourseRepository courseRepository;
    private final MaterialRepository materialRepository;
    private final RewardService rewardService; // ✅ Tích hợp UC32
    private final ProgressMapper progressMapper;

    //--------------------------------------------------------------------------
    // Cập nhật tiến độ học tập của học sinh
    //--------------------------------------------------------------------------

    @Override
    public ProgressResponse updateStudentProgress(Long studentId, UUID courseId, UUID materialId) {
        log.info("Updating progress for student {} in course {} at material {}", studentId, courseId, materialId);

        // 1️⃣ Lấy thông tin khóa học và học liệu
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", "id", materialId));

        // 2️⃣ Tìm hoặc tạo tiến độ mới
        Progress progress = progressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElse(new Progress(null, studentId, course, 0, null, null));

        // 3️⃣ Cập nhật học liệu cuối cùng đã hoàn thành
        progress.setLastMaterial(material);

        // 4️⃣ Tính toán phần trăm hoàn thành
        List<Material> allMaterials = materialRepository.findByCourseIdOrderByDisplayOrderAsc(courseId);
        int materialIndex = allMaterials.indexOf(material);
        if (materialIndex != -1 && !allMaterials.isEmpty()) {
            int newPercent = (int) Math.round(((double) (materialIndex + 1) / allMaterials.size()) * 100);
            if (newPercent > progress.getPercentComplete()) {
                progress.setPercentComplete(newPercent);
            }
        }

        // 5️⃣ Lưu tiến độ vào DB
        Progress savedProgress = progressRepository.save(progress);

        // 6️⃣ (UC32) Trao thưởng nếu hoàn thành khóa học
        if (savedProgress.getPercentComplete() == 100) {
            rewardService.grantReward(studentId, 100, "COMPLETE_COURSE", course.getId());
        }

        // 7️⃣ Trả về DTO
        return progressMapper.toProgressResponse(savedProgress);
    }

    //--------------------------------------------------------------------------
    // Lấy tiến độ học tập của một học sinh trong khóa học
    //--------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public ProgressResponse getStudentProgressInCourse(Long studentId, UUID courseId) {
        log.info("Fetching progress for student {} in course {}", studentId, courseId);

        Progress progress = progressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Progress", "student & course", studentId + " & " + courseId));

        return progressMapper.toProgressResponse(progress);
    }

    //--------------------------------------------------------------------------
    // Lấy dashboard tiến độ cho giảng viên
    //--------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getCourseProgressDashboard(UUID courseId) {
        log.info("Fetching progress dashboard for course {}", courseId);

        return progressRepository.findByCourseId(courseId).stream()
                .map(progressMapper::toProgressResponse)
                .collect(Collectors.toList());
    }
}
