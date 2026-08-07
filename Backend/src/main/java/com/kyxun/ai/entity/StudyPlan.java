package com.kyxun.ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "study_plans")
public class StudyPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "subject_id")
    private UUID subjectId;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private Integer days;

    @Column(name = "hours_per_day", nullable = false)
    private Integer hoursPerDay;

    @Column(name = "total_chapters", nullable = false)
    private Integer totalChapters;

    @Column(name = "completed_chapters", nullable = false)
    private Integer completedChapters;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String goal;

    @Column(name = "plan_data", nullable = false, columnDefinition = "jsonb")
    private String planData;

    @Column(name = "source_document_ids", nullable = false, columnDefinition = "jsonb")
    private String sourceDocumentIds = "[]";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
