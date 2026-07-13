package com.kyxun.planner.entity;

import com.kyxun.common.enums.PlannerStatus;
import com.kyxun.common.model.BaseEntity;
import com.kyxun.entity.Task;
import com.kyxun.entity.User;
import com.kyxun.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
        name = "study_sessions",
        indexes = {
                @Index(name = "idx_session_user", columnList = "user_id"),
                @Index(name = "idx_session_date", columnList = "planned_date")
        }
)
public class StudySession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id",
            foreignKey = @ForeignKey(name = "fk_session_subject"))
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id",
            foreignKey = @ForeignKey(name = "fk_session_task"))
    private Task task;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "actual_duration_minutes")
    private Integer actualDurationMinutes;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlannerStatus status = PlannerStatus.PLANNED;
}
