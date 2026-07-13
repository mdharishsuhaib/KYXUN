package com.kyxun.task.repository;

import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import com.kyxun.entity.Task;
import com.kyxun.entity.User;
import com.kyxun.subject.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    Page<Task> findByUser(User user, Pageable pageable);

    Page<Task> findByUserAndStatus(User user, Status status, Pageable pageable);

    Page<Task> findByUserAndPriority(User user, Priority priority, Pageable pageable);

    Page<Task> findByUserAndSubject(User user, Subject subject, Pageable pageable);

    Optional<Task> findByIdAndUser(UUID id, User user);

    List<Task> findByUserAndDueDateBetween(User user, OffsetDateTime start, OffsetDateTime end);

    List<Task> findByUserAndStatus(User user, Status status);

    long countByUserAndStatus(User user, Status status);

    long countByUser(User user);

    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.dueDate <= :deadline AND t.status != 'COMPLETED' AND t.status != 'CANCELLED' ORDER BY t.dueDate ASC")
    List<Task> findUpcomingDeadlines(@Param("user") User user, @Param("deadline") OffsetDateTime deadline);
}
