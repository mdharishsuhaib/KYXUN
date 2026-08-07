package com.kyxun.ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "readiness_scores")
public class ReadinessScore {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(name = "readiness_score", nullable = false)
    private Integer readinessScore;

    @Column(name = "knowledge_coverage", nullable = false)
    private Integer knowledgeCoverage;

    @Column(name = "revision_readiness", nullable = false)
    private Integer revisionReadiness;

    @Column(name = "predicted_marks", nullable = false, length = 100)
    private String predictedMarks;

    @Column(name = "strong_topics", nullable = false, columnDefinition = "jsonb")
    private String strongTopics;

    @Column(name = "weak_topics", nullable = false, columnDefinition = "jsonb")
    private String weakTopics;

    @Column(name = "exam_risk_level", nullable = false, length = 100)
    private String examRiskLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
