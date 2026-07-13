package com.kyxun.planner.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CompleteStudySessionRequest {

    @NotNull(message = "Actual duration is required")
    @Min(value = 1, message = "Actual duration must be at least 1 minute")
    private Integer actualDurationMinutes;

    private String notes;
}
