package com.kyxun.planner.dto.response;

import com.kyxun.common.enums.PlannerStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class StudySessionResponse {

    private UUID id;
    private String title;
    private LocalDate plannedDate;
    private Integer durationMinutes;
    private Integer actualDurationMinutes;
    private PlannerStatus status;
    private String notes;
    private UUID subjectId;
    private String subjectName;
    private UUID taskId;
    private String taskTitle;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
