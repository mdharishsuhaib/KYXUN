package com.kyxun.entity;

import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import com.kyxun.common.model.BaseEntity;
import com.kyxun.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.OffsetDateTime;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "tasks",
        indexes = {
                @Index(name = "idx_task_user_id", columnList = "user_id"),
                @Index(name = "idx_task_subject_id", columnList = "subject_id"),
                @Index(name = "idx_task_due_date", columnList = "due_date"),
                @Index(name = "idx_task_status", columnList = "status")
        }
)
public class Task extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_task_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_task_subject"))
    private Subject subject;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date")
    private OffsetDateTime dueDate;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
