package com.kyxun.examination.dto.request;

import com.kyxun.examination.entity.Examination.ExamType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateExaminationRequest {

    @NotNull(message = "Subject ID is required")
    private UUID subjectId;

    private UUID semesterId;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotNull(message = "Exam type is required")
    private ExamType examType;

    @NotNull(message = "Exam date is required")
    private LocalDate examDate;

    private LocalTime startTime;
    private LocalTime endTime;

    @Size(max = 255)
    private String venue;

    @Positive(message = "Max marks must be positive")
    private Integer maxMarks;

    @Positive(message = "Passing marks must be positive")
    private Integer passingMarks;

    private String notes;
}
