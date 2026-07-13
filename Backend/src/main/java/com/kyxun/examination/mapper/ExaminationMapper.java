package com.kyxun.examination.mapper;

import com.kyxun.examination.dto.response.ExaminationResponse;
import com.kyxun.examination.entity.Examination;
import org.springframework.stereotype.Component;

@Component
public class ExaminationMapper {

    public ExaminationResponse toResponse(Examination exam) {
        Boolean passed = null;
        if (exam.getMarksObtained() != null && exam.getPassingMarks() != null) {
            passed = exam.getMarksObtained() >= exam.getPassingMarks();
        }

        return ExaminationResponse.builder()
                .id(exam.getId())
                .subjectId(exam.getSubject().getId())
                .subjectName(exam.getSubject().getName())
                .semesterId(exam.getSemester() != null ? exam.getSemester().getId() : null)
                .semesterName(exam.getSemester() != null ? exam.getSemester().getName() : null)
                .title(exam.getTitle())
                .examType(exam.getExamType())
                .examDate(exam.getExamDate())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .venue(exam.getVenue())
                .maxMarks(exam.getMaxMarks())
                .passingMarks(exam.getPassingMarks())
                .marksObtained(exam.getMarksObtained())
                .passed(passed)
                .notes(exam.getNotes())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }
}
