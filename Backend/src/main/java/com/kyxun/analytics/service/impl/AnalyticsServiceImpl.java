package com.kyxun.analytics.service.impl;

import com.kyxun.analytics.dto.response.DashboardStatsResponse;
import com.kyxun.analytics.dto.response.TaskAnalyticsResponse;
import com.kyxun.analytics.service.AnalyticsService;
import com.kyxun.common.enums.Status;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.Task;
import com.kyxun.entity.User;
import com.kyxun.notification.repository.NotificationRepository;
import com.kyxun.planner.repository.StudySessionRepository;
import com.kyxun.subject.repository.SubjectRepository;
import com.kyxun.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final TaskRepository taskRepository;
    private final SubjectRepository subjectRepository;
    private final StudySessionRepository studySessionRepository;
    private final NotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        User user = securityUtils.getCurrentUser();

        long totalTasks = taskRepository.countByUser(user);
        long completedTasks = taskRepository.countByUserAndStatus(user, Status.COMPLETED);
        long pendingTasks = taskRepository.countByUserAndStatus(user, Status.PENDING);
        long inProgressTasks = taskRepository.countByUserAndStatus(user, Status.IN_PROGRESS);
        double completionRate = totalTasks > 0 ? (double) completedTasks / totalTasks * 100 : 0;

        long totalSubjects = subjectRepository.findByUser(user).size();

        LocalDate now = LocalDate.now();
        int studyMinutes = studySessionRepository.sumActualDurationByUserAndDateRange(
                user, now.minusDays(6), now);
        long totalSessions = studySessionRepository.findByUserOrderByPlannedDateAsc(user).size();

        OffsetDateTime nextWeek = OffsetDateTime.now().plusDays(7);
        List<Task> upcomingTasks = taskRepository.findUpcomingDeadlines(user, nextWeek);

        long unreadNotifications = notificationRepository.countByUserAndIsReadFalse(user);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
        List<DashboardStatsResponse.UpcomingDeadlineDto> deadlineDtos = upcomingTasks.stream()
                .limit(5)
                .map(t -> DashboardStatsResponse.UpcomingDeadlineDto.builder()
                        .taskTitle(t.getTitle())
                        .subjectName(t.getSubject().getName())
                        .dueDate(t.getDueDate() != null ? t.getDueDate().format(formatter) : null)
                        .priority(t.getPriority().name())
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .totalSubjects(totalSubjects)
                .totalStudySessions(totalSessions)
                .studyMinutesThisWeek(studyMinutes)
                .upcomingDeadlines(upcomingTasks.size())
                .unreadNotifications(unreadNotifications)
                .nextDeadlines(deadlineDtos)
                .build();
    }

    @Override
    public TaskAnalyticsResponse getTaskAnalytics() {
        User user = securityUtils.getCurrentUser();

        long totalTasks = taskRepository.countByUser(user);
        long completedTasks = taskRepository.countByUserAndStatus(user, Status.COMPLETED);
        long pendingTasks = taskRepository.countByUserAndStatus(user, Status.PENDING);
        long inProgressTasks = taskRepository.countByUserAndStatus(user, Status.IN_PROGRESS);
        long cancelledTasks = taskRepository.countByUserAndStatus(user, Status.CANCELLED);
        double completionRate = totalTasks > 0 ? (double) completedTasks / totalTasks * 100 : 0;

        List<Task> allTasks = taskRepository.findByUser(user,
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        Map<String, Long> tasksByPriority = allTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));

        Map<String, Long> tasksBySubject = allTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getSubject().getName(), Collectors.counting()));

        long overdueCount = allTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getDueDate().isBefore(OffsetDateTime.now())
                        && t.getStatus() != Status.COMPLETED
                        && t.getStatus() != Status.CANCELLED)
                .count();

        return TaskAnalyticsResponse.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .cancelledTasks(cancelledTasks)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .tasksByPriority(tasksByPriority)
                .tasksBySubject(tasksBySubject)
                .overdueTasksCount(overdueCount)
                .build();
    }
}
