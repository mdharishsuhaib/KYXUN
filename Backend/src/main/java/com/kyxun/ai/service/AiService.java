package com.kyxun.ai.service;

import com.kyxun.ai.dto.request.AiSuggestionRequest;
import com.kyxun.ai.dto.response.AiSuggestionResponse;

public interface AiService {

    AiSuggestionResponse getStudySuggestion(AiSuggestionRequest request);

    AiSuggestionResponse generateStudyPlan(String topic);
}
