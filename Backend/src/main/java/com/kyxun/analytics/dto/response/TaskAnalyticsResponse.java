package com.kyxun.analytics.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class TaskAnalyticsResponse {

    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private long cancelledTasks;
    private double completionRate;
    private Map<String, Long> tasksByPriority;
    private Map<String, Long> tasksBySubject;
    private long overdueTasksCount;
}
