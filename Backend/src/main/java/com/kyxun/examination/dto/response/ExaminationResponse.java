package com.kyxun.examination.dto.response;

import com.kyxun.examination.entity.Examination.ExamType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ExaminationResponse {

    private UUID id;
    private UUID subjectId;
    private String subjectName;
    private UUID semesterId;
    private String semesterName;
    private String title;
    private ExamType examType;
    private LocalDate examDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String venue;
    private Integer maxMarks;
    private Integer passingMarks;
    private Integer marksObtained;
    private Boolean passed;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
