package com.kyxun.task.mapper;

import com.kyxun.entity.Task;
import com.kyxun.task.dto.response.TaskResponse;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .subjectId(task.getSubject().getId())
                .subjectName(task.getSubject().getName())
                .dueDate(task.getDueDate())
                .estimatedMinutes(task.getEstimatedMinutes())
                .priority(task.getPriority())
                .status(task.getStatus())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
