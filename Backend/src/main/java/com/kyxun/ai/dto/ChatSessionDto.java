package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class ChatSessionDto {
    private UUID id;
    private UUID userId;
    private UUID planId;
    private UUID subjectId;
    private String title;
    private OffsetDateTime createdAt;
}
