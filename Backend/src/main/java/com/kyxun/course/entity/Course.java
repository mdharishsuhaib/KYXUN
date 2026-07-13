package com.kyxun.course.entity;

import com.kyxun.common.model.BaseEntity;
import com.kyxun.entity.User;
import com.kyxun.semester.entity.Semester;
import com.kyxun.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
        name = "courses",
        indexes = {
                @Index(name = "idx_course_user", columnList = "user_id"),
                @Index(name = "idx_course_semester", columnList = "semester_id")
        }
)
public class Course extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_course_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id",
            foreignKey = @ForeignKey(name = "fk_course_semester"))
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id",
            foreignKey = @ForeignKey(name = "fk_course_subject"))
    private Subject subject;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String instructor;

    @Column(name = "course_code", length = 30)
    private String courseCode;

    @Column(name = "credits")
    private Integer credits;

    @Column(name = "schedule_info", columnDefinition = "TEXT")
    private String scheduleInfo;

    @Column(length = 10)
    private String color;

    @Column(columnDefinition = "TEXT")
    private String description;
}
