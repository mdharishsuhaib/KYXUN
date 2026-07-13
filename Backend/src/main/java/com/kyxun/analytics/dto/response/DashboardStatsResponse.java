package com.kyxun.analytics.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardStatsResponse {

    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private double completionRate;
    private long totalSubjects;
    private long totalStudySessions;
    private int studyMinutesThisWeek;
    private long upcomingDeadlines;
    private long unreadNotifications;
    private List<UpcomingDeadlineDto> nextDeadlines;

    @Data
    @Builder
    public static class UpcomingDeadlineDto {
        private String taskTitle;
        private String subjectName;
        private String dueDate;
        private String priority;
    }
}
