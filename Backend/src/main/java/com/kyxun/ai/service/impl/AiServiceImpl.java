package com.kyxun.ai.service.impl;

import com.kyxun.ai.dto.request.AiSuggestionRequest;
import com.kyxun.ai.dto.response.AiSuggestionResponse;
import com.kyxun.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final ChatClient chatClient;

    @Override
    public AiSuggestionResponse getStudySuggestion(AiSuggestionRequest request) {
        log.info("Generating AI suggestion for prompt: {}", request.getPrompt());
        long startTime = System.currentTimeMillis();

        String systemPrompt = "You are Kyxun, an expert AI academic advisor. " +
                "Provide concise, actionable study advice based on the user's prompt and context. " +
                "Do not exceed 3 paragraphs. Keep it encouraging and structural.";

        String responseText = chatClient.prompt()
                .system(systemPrompt)
                .user(request.getPrompt() + (request.getContext() != null ? "\nContext: " + request.getContext() : ""))
                .call()
                .content();

        return AiSuggestionResponse.builder()
                .suggestion(responseText)
                .modelUsed("spring-ai-default-model")
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();
    }

    @Override
    public AiSuggestionResponse generateStudyPlan(String topic) {
        log.info("Generating study plan for topic: {}", topic);
        long startTime = System.currentTimeMillis();

        String systemPrompt = "You are Kyxun, an expert academic planner. " +
                "Create a structured 3-day study plan for the given topic. " +
                "Format the response clearly with 'Day 1', 'Day 2', and 'Day 3' headers.";

        String responseText = chatClient.prompt()
                .system(systemPrompt)
                .user("Create a study plan for: " + topic)
                .call()
                .content();

        return AiSuggestionResponse.builder()
                .suggestion(responseText)
                .modelUsed("spring-ai-default-model")
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();
    }
}
