package com.kyxun.ai.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiSuggestionResponse {

    private String suggestion;
    private String modelUsed;
    private Long processingTimeMs;
}
