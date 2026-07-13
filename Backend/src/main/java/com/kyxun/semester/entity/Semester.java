package com.kyxun.semester.entity;

import com.kyxun.common.enums.SemesterType;
import com.kyxun.common.model.BaseEntity;
import com.kyxun.entity.User;
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
        name = "semesters",
        indexes = {
                @Index(name = "idx_semester_user", columnList = "user_id")
        }
)
public class Semester extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_semester_user"))
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "semester_type", nullable = false, length = 20)
    private SemesterType semesterType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(length = 50)
    private String academicYear;
}
