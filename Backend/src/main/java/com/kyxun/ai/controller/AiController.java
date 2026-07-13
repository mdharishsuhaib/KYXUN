package com.kyxun.ai.controller;

import com.kyxun.ai.dto.request.AiSuggestionRequest;
import com.kyxun.ai.dto.response.AiSuggestionResponse;
import com.kyxun.ai.service.AiService;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/suggest")
    public ApiResponse<AiSuggestionResponse> getSuggestion(
            @Valid @RequestBody AiSuggestionRequest request) {
        return ApiResponseBuilder.success("AI suggestion generated", aiService.getStudySuggestion(request));
    }

    @GetMapping("/plan")
    public ApiResponse<AiSuggestionResponse> generatePlan(
            @RequestParam String topic) {
        return ApiResponseBuilder.success("AI study plan generated", aiService.generateStudyPlan(topic));
    }
}
