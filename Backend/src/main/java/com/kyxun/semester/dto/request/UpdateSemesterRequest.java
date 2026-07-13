package com.kyxun.semester.dto.request;

import com.kyxun.common.enums.SemesterType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateSemesterRequest {

    @Size(max = 100)
    private String name;

    private SemesterType semesterType;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 50)
    private String academicYear;

    private Boolean isActive;
}
