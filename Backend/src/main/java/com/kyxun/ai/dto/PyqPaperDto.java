package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class PyqPaperDto {
    private UUID id;
    private UUID userId;
    private String subject;
    private String paperText;
    private OffsetDateTime createdAt;
}
