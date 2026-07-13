package com.kyxun.course.mapper;

import com.kyxun.course.dto.response.CourseResponse;
import com.kyxun.course.entity.Course;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public CourseResponse toResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .instructor(course.getInstructor())
                .courseCode(course.getCourseCode())
                .credits(course.getCredits())
                .scheduleInfo(course.getScheduleInfo())
                .color(course.getColor())
                .description(course.getDescription())
                .semesterId(course.getSemester() != null ? course.getSemester().getId() : null)
                .semesterName(course.getSemester() != null ? course.getSemester().getName() : null)
                .subjectId(course.getSubject() != null ? course.getSubject().getId() : null)
                .subjectName(course.getSubject() != null ? course.getSubject().getName() : null)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
