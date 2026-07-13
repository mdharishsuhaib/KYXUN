package com.kyxun.task.dto.request;

import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class UpdateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    private String description;

    private UUID subjectId;

    private OffsetDateTime dueDate;

    @Positive
    private Integer estimatedMinutes;

    private Priority priority;

    private Status status;
}
