package com.kyxun.semester.mapper;

import com.kyxun.semester.dto.response.SemesterResponse;
import com.kyxun.semester.entity.Semester;
import org.springframework.stereotype.Component;

@Component
public class SemesterMapper {

    public SemesterResponse toResponse(Semester semester) {
        return SemesterResponse.builder()
                .id(semester.getId())
                .name(semester.getName())
                .semesterType(semester.getSemesterType())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .academicYear(semester.getAcademicYear())
                .isActive(semester.getIsActive())
                .createdAt(semester.getCreatedAt())
                .updatedAt(semester.getUpdatedAt())
                .build();
    }
}
