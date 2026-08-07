package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class StudyPlanDto {
    private UUID id;
    private UUID userId;
    private UUID subjectId;
    private String subject;
    private Integer days;
    private Integer hoursPerDay;
    private Integer totalChapters;
    private Integer completedChapters;
    private String goal;
    private String planData;
    private String sourceDocumentIds;
    private OffsetDateTime createdAt;
}
