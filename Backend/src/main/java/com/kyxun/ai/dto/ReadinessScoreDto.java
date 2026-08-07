package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class ReadinessScoreDto {
    private UUID id;
    private UUID userId;
    private UUID planId;
    private Integer readinessScore;
    private Integer knowledgeCoverage;
    private Integer revisionReadiness;
    private String predictedMarks;
    private String strongTopics;
    private String weakTopics;
    private String examRiskLevel;
    private OffsetDateTime createdAt;
}
