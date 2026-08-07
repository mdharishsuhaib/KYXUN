package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class VivaAttemptDto {
    private UUID id;
    private UUID userId;
    private UUID planId;
    private String question;
    private String userAnswer;
    private String modelAnswer;
    private Integer accuracyScore;
    private Integer confidenceScore;
    private String feedback;
    private String confidenceFeedback;
    private OffsetDateTime createdAt;
}
