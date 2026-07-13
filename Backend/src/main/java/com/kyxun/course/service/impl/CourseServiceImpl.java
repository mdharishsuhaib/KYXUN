package com.kyxun.course.service.impl;

import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.course.dto.request.CreateCourseRequest;
import com.kyxun.course.dto.request.UpdateCourseRequest;
import com.kyxun.course.dto.response.CourseResponse;
import com.kyxun.course.entity.Course;
import com.kyxun.course.mapper.CourseMapper;
import com.kyxun.course.repository.CourseRepository;
import com.kyxun.course.service.CourseService;
import com.kyxun.entity.User;
import com.kyxun.semester.entity.Semester;
import com.kyxun.semester.repository.SemesterRepository;
import com.kyxun.subject.entity.Subject;
import com.kyxun.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final CourseMapper courseMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public CourseResponse create(CreateCourseRequest request) {
        User user = securityUtils.getCurrentUser();

        Course.CourseBuilder<?, ?> builder = Course.builder()
                .user(user)
                .name(request.getName())
                .instructor(request.getInstructor())
                .courseCode(request.getCourseCode())
                .credits(request.getCredits())
                .scheduleInfo(request.getScheduleInfo())
                .color(request.getColor())
                .description(request.getDescription());

        if (request.getSemesterId() != null) {
            Semester semester = semesterRepository.findByIdAndUser(request.getSemesterId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
            builder.semester(semester);
        }

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            builder.subject(subject);
        }

        return courseMapper.toResponse(courseRepository.save(builder.build()));
    }

    @Override
    public List<CourseResponse> getAll() {
        User user = securityUtils.getCurrentUser();
        return courseRepository.findByUser(user).stream()
                .map(courseMapper::toResponse).toList();
    }

    @Override
    public List<CourseResponse> getBySemester(UUID semesterId) {
        User user = securityUtils.getCurrentUser();
        Semester semester = semesterRepository.findByIdAndUser(semesterId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        return courseRepository.findByUserAndSemester(user, semester).stream()
                .map(courseMapper::toResponse).toList();
    }

    @Override
    public CourseResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        return courseMapper.toResponse(
                courseRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new ResourceNotFoundException("Course not found")));
    }

    @Override
    @Transactional
    public CourseResponse update(UUID id, UpdateCourseRequest request) {
        User user = securityUtils.getCurrentUser();
        Course course = courseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (request.getName() != null) course.setName(request.getName());
        if (request.getInstructor() != null) course.setInstructor(request.getInstructor());
        if (request.getCourseCode() != null) course.setCourseCode(request.getCourseCode());
        if (request.getCredits() != null) course.setCredits(request.getCredits());
        if (request.getScheduleInfo() != null) course.setScheduleInfo(request.getScheduleInfo());
        if (request.getColor() != null) course.setColor(request.getColor());
        if (request.getDescription() != null) course.setDescription(request.getDescription());

        if (request.getSemesterId() != null) {
            Semester semester = semesterRepository.findByIdAndUser(request.getSemesterId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
            course.setSemester(semester);
        }

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Course course = courseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        courseRepository.delete(course);
    }
}
