package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Data
public class FlashcardDto {
    private UUID id;
    private UUID userId;
    private UUID planId;
    private String front;
    private String back;
    private String tag;
    private String difficulty;
    private Boolean isMastered;
    private OffsetDateTime createdAt;
}
