package com.kyxun.department.entity;

import com.kyxun.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "departments")
public class Department extends BaseEntity {

    @Column(nullable = false, length = 150, unique = true)
    private String name;

    @Column(length = 20, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;
}
