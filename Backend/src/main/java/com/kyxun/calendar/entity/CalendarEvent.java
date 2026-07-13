package com.kyxun.calendar.entity;

import com.kyxun.common.enums.EventType;
import com.kyxun.common.model.BaseEntity;
import com.kyxun.course.entity.Course;
import com.kyxun.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
        name = "calendar_events",
        indexes = {
                @Index(name = "idx_event_user", columnList = "user_id"),
                @Index(name = "idx_event_start", columnList = "start_date_time"),
                @Index(name = "idx_event_type", columnList = "event_type")
        }
)
public class CalendarEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_user"))
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "event_type", nullable = false, length = 20)
    private EventType eventType = EventType.OTHER;

    @Column(name = "start_date_time", nullable = false)
    private OffsetDateTime startDateTime;

    @Column(name = "end_date_time")
    private OffsetDateTime endDateTime;

    @Builder.Default
    @Column(name = "all_day", nullable = false)
    private Boolean allDay = false;

    @Column(length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id",
            foreignKey = @ForeignKey(name = "fk_event_course"))
    private Course course;

    @Column(length = 10)
    private String color;
}
