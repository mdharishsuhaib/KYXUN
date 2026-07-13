package com.kyxun.examination.entity;

import com.kyxun.common.model.BaseEntity;
import com.kyxun.entity.User;
import com.kyxun.semester.entity.Semester;
import com.kyxun.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
        name = "examinations",
        indexes = {
                @Index(name = "idx_exam_user", columnList = "user_id"),
                @Index(name = "idx_exam_subject", columnList = "subject_id"),
                @Index(name = "idx_exam_semester", columnList = "semester_id"),
                @Index(name = "idx_exam_date", columnList = "exam_date")
        }
)
public class Examination extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_exam_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_exam_subject"))
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id",
            foreignKey = @ForeignKey(name = "fk_exam_semester"))
    private Semester semester;

    @Column(nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, length = 30)
    private ExamType examType;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "venue", length = 255)
    private String venue;

    @Column(name = "max_marks")
    private Integer maxMarks;

    @Column(name = "passing_marks")
    private Integer passingMarks;

    @Column(name = "marks_obtained")
    private Integer marksObtained;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum ExamType {
        SEMESTER_EXAM, MODEL_EXAM, INTERNAL_ASSESSMENT, VIVA, PRACTICAL, ASSIGNMENT
    }
}
