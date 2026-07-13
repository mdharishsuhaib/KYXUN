package com.kyxun.examination.dto.request;

import com.kyxun.examination.entity.Examination.ExamType;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class UpdateExaminationRequest {

    private UUID subjectId;
    private UUID semesterId;

    @Size(max = 150)
    private String title;

    private ExamType examType;
    private LocalDate examDate;
    private LocalTime startTime;
    private LocalTime endTime;

    @Size(max = 255)
    private String venue;

    @Positive
    private Integer maxMarks;

    @Positive
    private Integer passingMarks;

    @Positive
    private Integer marksObtained;

    private String notes;
}
