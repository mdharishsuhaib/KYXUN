package com.kyxun.task.dto.response;

import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class TaskResponse {

    private UUID id;
    private String title;
    private String description;
    private UUID subjectId;
    private String subjectName;
    private OffsetDateTime dueDate;
    private Integer estimatedMinutes;
    private Priority priority;
    private Status status;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
