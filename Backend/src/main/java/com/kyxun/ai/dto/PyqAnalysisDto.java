package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class PyqAnalysisDto {
    private UUID id;
    private UUID userId;
    private UUID paperId;
    private String subject;
    private String analysisData;
    private OffsetDateTime createdAt;
}
