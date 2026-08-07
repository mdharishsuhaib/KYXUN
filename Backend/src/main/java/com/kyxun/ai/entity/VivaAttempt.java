package com.kyxun.ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "viva_attempts")
public class VivaAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "user_answer", nullable = false, columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "model_answer", nullable = false, columnDefinition = "TEXT")
    private String modelAnswer;

    @Column(name = "accuracy_score", nullable = false)
    private Integer accuracyScore;

    @Column(name = "confidence_score", nullable = false)
    private Integer confidenceScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "confidence_feedback", columnDefinition = "TEXT")
    private String confidenceFeedback;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
