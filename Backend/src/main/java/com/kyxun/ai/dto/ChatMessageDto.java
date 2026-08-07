package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class ChatMessageDto {
    private UUID id;
    private UUID sessionId;
    private UUID userId;
    private String role;
    private String content;
    private String attachments;
    private OffsetDateTime createdAt;
}
