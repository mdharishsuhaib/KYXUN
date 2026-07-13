package com.kyxun.subject.entity;

import com.kyxun.entity.User;
import com.kyxun.common.model.BaseEntity;
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
        name = "subjects",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_subject_user_name",
                        columnNames = {"user_id","name"}
                )
        }
)
public class Subject extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_subject_user")
    )
    private User user;

    @Column(nullable = false,length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

}