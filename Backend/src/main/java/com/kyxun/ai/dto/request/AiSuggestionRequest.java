package com.kyxun.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiSuggestionRequest {

    @NotBlank(message = "Prompt is required")
    private String prompt;

    private String context;
}
