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

public interface ProgressService {
    ProgressResponse updateStudentProgress(UUID studentId, UUID courseId, UUID materialId);
    ProgressResponse markFinalExamResult(UUID studentId, UUID courseId, boolean passed);
    ProgressResponse getStudentProgressInCourse(UUID studentId, UUID courseId);
    List<ProgressResponse> getCourseProgressDashboard(UUID courseId);
}

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class ProgressServiceImpl implements ProgressService {

    private final ProgressRepository progressRepository;
    private final CourseRepository courseRepository;
    private final MaterialRepository materialRepository;
    private final RewardService rewardService;
    private final ProgressMapper progressMapper;

    @Override
    public ProgressResponse updateStudentProgress(UUID studentId, UUID courseId, UUID materialId) {
        log.info("Updating progress for student {} in course {} at material {}", studentId, courseId, materialId);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Material material = materialRepository.findActiveById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", "id", materialId));

        Progress progress = progressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElse(Progress.builder()
                        .studentId(studentId)
                        .course(course)
                        .percentComplete(0)
                        .passedFinalExam(false)
                        .courseCompleted(false)
                        .build());

        progress.setLastMaterialId(material.getId());

        List<Material> allMaterials = materialRepository.findByCourseIdOrderByDisplayOrderAsc(courseId);
        int materialIndex = -1;
        for (int i = 0; i < allMaterials.size(); i++) {
            if (allMaterials.get(i).getId().equals(material.getId())) {
                materialIndex = i;
                break;
            }
        }
        if (materialIndex != -1 && !allMaterials.isEmpty()) {
            int newPercent = (int) Math.round(((double) (materialIndex + 1) / allMaterials.size()) * 100);
            if (newPercent > progress.getPercentComplete()) {
                progress.setPercentComplete(newPercent);
            }
        }

        boolean completedBefore = progress.isCourseCompleted();
        updateCompletionStatus(progress);

        Progress savedProgress = progressRepository.save(progress);
        maybeGrantCompletionReward(course, savedProgress, completedBefore);

        return progressMapper.toProgressResponse(savedProgress);
    }

    @Override
    public ProgressResponse markFinalExamResult(UUID studentId, UUID courseId, boolean passed) {
        log.info("Updating final exam flag for student {} in course {} -> passed? {}", studentId, courseId, passed);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Progress progress = progressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElse(Progress.builder()
                        .studentId(studentId)
                        .course(course)
                        .percentComplete(0)
                        .passedFinalExam(false)
                        .courseCompleted(false)
                        .build());

        boolean completedBefore = progress.isCourseCompleted();

        progress.setPassedFinalExam(passed);
        updateCompletionStatus(progress);

        Progress savedProgress = progressRepository.save(progress);
        maybeGrantCompletionReward(course, savedProgress, completedBefore);

        return progressMapper.toProgressResponse(savedProgress);
    }

    @Override
    @Transactional(readOnly = true)
    public ProgressResponse getStudentProgressInCourse(UUID studentId, UUID courseId) {
        log.info("Fetching progress for student {} in course {}", studentId, courseId);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Progress progress = progressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElse(Progress.builder()
                        .studentId(studentId)
                        .course(course)
                        .percentComplete(0)
                        .passedFinalExam(false)
                        .courseCompleted(false)
                        .build());

        return progressMapper.toProgressResponse(progress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getCourseProgressDashboard(UUID courseId) {
        log.info("Fetching progress dashboard for course {}", courseId);

        return progressRepository.findByCourseId(courseId).stream()
                .map(progressMapper::toProgressResponse)
                .collect(Collectors.toList());
    }

    private void updateCompletionStatus(Progress progress) {
        boolean shouldComplete = progress.getPercentComplete() == 100 && progress.isPassedFinalExam();
        progress.setCourseCompleted(shouldComplete);
    }

    private void maybeGrantCompletionReward(Course course, Progress progress, boolean completedBefore) {
        if (!completedBefore && progress.isCourseCompleted()) {
            rewardService.grantReward(progress.getStudentId(), 100, "COURSE_COMPLETE", course.getId(), course.getId());
        }
    }
}
