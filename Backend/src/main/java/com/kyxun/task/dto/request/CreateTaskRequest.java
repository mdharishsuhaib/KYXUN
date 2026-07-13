package com.kyxun.task.dto.request;

import com.kyxun.common.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class CreateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    @NotNull(message = "Subject ID is required")
    private UUID subjectId;

    private OffsetDateTime dueDate;

    @Positive(message = "Estimated minutes must be positive")
    private Integer estimatedMinutes;

    private Priority priority = Priority.MEDIUM;
}
