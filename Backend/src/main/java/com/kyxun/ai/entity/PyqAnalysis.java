package com.kyxun.ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "pyq_analyses")
public class PyqAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "paper_id")
    private UUID paperId;

    @Column(nullable = false)
    private String subject;

    @Column(name = "analysis_data", nullable = false, columnDefinition = "jsonb")
    private String analysisData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
