package com.kyxun.ai.service.impl;

import com.kyxun.ai.entity.*;
import com.kyxun.ai.dto.*;
import com.kyxun.ai.dto.request.AiSuggestionRequest;
import com.kyxun.ai.dto.response.AiSuggestionResponse;
import com.kyxun.ai.repository.*;
import com.kyxun.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final StudyPlanRepository studyPlanRepository;
    private final FlashcardRepository flashcardRepository;
    private final VivaAttemptRepository vivaAttemptRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PyqPaperRepository pyqPaperRepository;
    private final PyqAnalysisRepository pyqAnalysisRepository;
    private final ReadinessScoreRepository readinessScoreRepository;
    private final ChatClient chatClient;

    @Override
    public StudyPlan saveStudyPlan(StudyPlanDto dto) {
        StudyPlan entity = new StudyPlan();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setSubjectId(dto.getSubjectId());
        entity.setSubject(dto.getSubject());
        entity.setDays(dto.getDays());
        entity.setHoursPerDay(dto.getHoursPerDay());
        entity.setTotalChapters(dto.getTotalChapters());
        entity.setCompletedChapters(dto.getCompletedChapters());
        entity.setGoal(dto.getGoal());
        entity.setPlanData(dto.getPlanData());
        entity.setSourceDocumentIds(dto.getSourceDocumentIds());
        return studyPlanRepository.save(entity);
    }
    @Override public Optional<StudyPlan> getStudyPlan(UUID id) { return studyPlanRepository.findById(id); }
    @Override public List<StudyPlan> getAllStudyPlans() { return studyPlanRepository.findAll(); }
    @Override public void deleteStudyPlan(UUID id) { studyPlanRepository.deleteById(id); }

    @Override
    public Flashcard saveFlashcard(FlashcardDto dto) {
        Flashcard entity = new Flashcard();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPlanId(dto.getPlanId());
        entity.setFront(dto.getFront());
        entity.setBack(dto.getBack());
        entity.setTag(dto.getTag());
        entity.setDifficulty(dto.getDifficulty());
        entity.setIsMastered(dto.getIsMastered());
        return flashcardRepository.save(entity);
    }
    @Override public Optional<Flashcard> getFlashcard(UUID id) { return flashcardRepository.findById(id); }
    @Override public List<Flashcard> getAllFlashcards() { return flashcardRepository.findAll(); }
    @Override public void deleteFlashcard(UUID id) { flashcardRepository.deleteById(id); }

    @Override
    public VivaAttempt saveVivaAttempt(VivaAttemptDto dto) {
        VivaAttempt entity = new VivaAttempt();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPlanId(dto.getPlanId());
        entity.setQuestion(dto.getQuestion());
        entity.setUserAnswer(dto.getUserAnswer());
        entity.setModelAnswer(dto.getModelAnswer());
        entity.setAccuracyScore(dto.getAccuracyScore());
        entity.setConfidenceScore(dto.getConfidenceScore());
        entity.setFeedback(dto.getFeedback());
        entity.setConfidenceFeedback(dto.getConfidenceFeedback());
        return vivaAttemptRepository.save(entity);
    }
    @Override public Optional<VivaAttempt> getVivaAttempt(UUID id) { return vivaAttemptRepository.findById(id); }
    @Override public List<VivaAttempt> getAllVivaAttempts() { return vivaAttemptRepository.findAll(); }
    @Override public void deleteVivaAttempt(UUID id) { vivaAttemptRepository.deleteById(id); }

    @Override
    public ChatSession saveChatSession(ChatSessionDto dto) {
        ChatSession entity = new ChatSession();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPlanId(dto.getPlanId());
        entity.setSubjectId(dto.getSubjectId());
        entity.setTitle(dto.getTitle());
        return chatSessionRepository.save(entity);
    }
    @Override public Optional<ChatSession> getChatSession(UUID id) { return chatSessionRepository.findById(id); }
    @Override public List<ChatSession> getAllChatSessions() { return chatSessionRepository.findAll(); }
    @Override public void deleteChatSession(UUID id) { chatSessionRepository.deleteById(id); }

    @Override
    public ChatMessage saveChatMessage(ChatMessageDto dto) {
        ChatMessage entity = new ChatMessage();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setSessionId(dto.getSessionId());
        entity.setUserId(dto.getUserId());
        entity.setRole(dto.getRole());
        entity.setContent(dto.getContent());
        entity.setAttachments(dto.getAttachments());
        return chatMessageRepository.save(entity);
    }
    @Override public Optional<ChatMessage> getChatMessage(UUID id) { return chatMessageRepository.findById(id); }
    @Override public List<ChatMessage> getAllChatMessages() { return chatMessageRepository.findAll(); }
    @Override public void deleteChatMessage(UUID id) { chatMessageRepository.deleteById(id); }

    @Override
    public PyqPaper savePyqPaper(PyqPaperDto dto) {
        PyqPaper entity = new PyqPaper();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setSubject(dto.getSubject());
        entity.setPaperText(dto.getPaperText());
        return pyqPaperRepository.save(entity);
    }
    @Override public Optional<PyqPaper> getPyqPaper(UUID id) { return pyqPaperRepository.findById(id); }
    @Override public List<PyqPaper> getAllPyqPapers() { return pyqPaperRepository.findAll(); }
    @Override public void deletePyqPaper(UUID id) { pyqPaperRepository.deleteById(id); }

    @Override
    public PyqAnalysis savePyqAnalysis(PyqAnalysisDto dto) {
        PyqAnalysis entity = new PyqAnalysis();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPaperId(dto.getPaperId());
        entity.setSubject(dto.getSubject());
        entity.setAnalysisData(dto.getAnalysisData());
        return pyqAnalysisRepository.save(entity);
    }
    @Override public Optional<PyqAnalysis> getPyqAnalysis(UUID id) { return pyqAnalysisRepository.findById(id); }
    @Override public List<PyqAnalysis> getAllPyqAnalyses() { return pyqAnalysisRepository.findAll(); }
    @Override public void deletePyqAnalysis(UUID id) { pyqAnalysisRepository.deleteById(id); }

    @Override
    public ReadinessScore saveReadinessScore(ReadinessScoreDto dto) {
        ReadinessScore entity = new ReadinessScore();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPlanId(dto.getPlanId());
        entity.setReadinessScore(dto.getReadinessScore());
        entity.setKnowledgeCoverage(dto.getKnowledgeCoverage());
        entity.setRevisionReadiness(dto.getRevisionReadiness());
        entity.setPredictedMarks(dto.getPredictedMarks());
        entity.setStrongTopics(dto.getStrongTopics());
        entity.setWeakTopics(dto.getWeakTopics());
        entity.setExamRiskLevel(dto.getExamRiskLevel());
        return readinessScoreRepository.save(entity);
    }
    @Override public Optional<ReadinessScore> getReadinessScore(UUID id) { return readinessScoreRepository.findById(id); }
    @Override public List<ReadinessScore> getAllReadinessScores() { return readinessScoreRepository.findAll(); }
    @Override public void deleteReadinessScore(UUID id) { readinessScoreRepository.deleteById(id); }

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
