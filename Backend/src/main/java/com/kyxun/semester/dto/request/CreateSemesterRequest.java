package com.kyxun.semester.dto.request;

import com.kyxun.common.enums.SemesterType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateSemesterRequest {

    @NotBlank(message = "Semester name is required")
    @Size(max = 100)
    private String name;

    @NotNull(message = "Semester type is required")
    private SemesterType semesterType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Size(max = 50)
    private String academicYear;

    private Boolean isActive = false;
}
