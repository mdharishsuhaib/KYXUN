package com.kyxun.ai.service;

import com.kyxun.ai.entity.*;
import com.kyxun.ai.dto.*;
import com.kyxun.ai.dto.request.AiSuggestionRequest;
import com.kyxun.ai.dto.response.AiSuggestionResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiService {
    StudyPlan saveStudyPlan(StudyPlanDto dto);
    Optional<StudyPlan> getStudyPlan(UUID id);
    List<StudyPlan> getAllStudyPlans();
    void deleteStudyPlan(UUID id);

    Flashcard saveFlashcard(FlashcardDto dto);
    Optional<Flashcard> getFlashcard(UUID id);
    List<Flashcard> getAllFlashcards();
    void deleteFlashcard(UUID id);

    VivaAttempt saveVivaAttempt(VivaAttemptDto dto);
    Optional<VivaAttempt> getVivaAttempt(UUID id);
    List<VivaAttempt> getAllVivaAttempts();
    void deleteVivaAttempt(UUID id);

    ChatSession saveChatSession(ChatSessionDto dto);
    Optional<ChatSession> getChatSession(UUID id);
    List<ChatSession> getAllChatSessions();
    void deleteChatSession(UUID id);

    ChatMessage saveChatMessage(ChatMessageDto dto);
    Optional<ChatMessage> getChatMessage(UUID id);
    List<ChatMessage> getAllChatMessages();
    void deleteChatMessage(UUID id);

    PyqPaper savePyqPaper(PyqPaperDto dto);
    Optional<PyqPaper> getPyqPaper(UUID id);
    List<PyqPaper> getAllPyqPapers();
    void deletePyqPaper(UUID id);

    PyqAnalysis savePyqAnalysis(PyqAnalysisDto dto);
    Optional<PyqAnalysis> getPyqAnalysis(UUID id);
    List<PyqAnalysis> getAllPyqAnalyses();
    void deletePyqAnalysis(UUID id);

    ReadinessScore saveReadinessScore(ReadinessScoreDto dto);
    Optional<ReadinessScore> getReadinessScore(UUID id);
    List<ReadinessScore> getAllReadinessScores();
    void deleteReadinessScore(UUID id);

    AiSuggestionResponse getStudySuggestion(AiSuggestionRequest request);
    AiSuggestionResponse generateStudyPlan(String topic);
}
