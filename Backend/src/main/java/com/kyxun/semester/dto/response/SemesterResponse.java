package com.kyxun.semester.dto.response;

import com.kyxun.common.enums.SemesterType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SemesterResponse {

    private UUID id;
    private String name;
    private SemesterType semesterType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String academicYear;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
