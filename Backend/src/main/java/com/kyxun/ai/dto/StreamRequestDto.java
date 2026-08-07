package com.kyxun.ai.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class StreamRequestDto {
    private UUID sessionId;
    private String message;
}
