package com.kyxun.ai.service;

import com.kyxun.ai.entity.*;
import com.kyxun.ai.dto.*;
import com.kyxun.ai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiService {
    private final StudyPlanRepository studyPlanRepository;
    private final FlashcardRepository flashcardRepository;
    private final VivaAttemptRepository vivaAttemptRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PyqPaperRepository pyqPaperRepository;
    private final PyqAnalysisRepository pyqAnalysisRepository;
    private final ReadinessScoreRepository readinessScoreRepository;

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
    public Optional<StudyPlan> getStudyPlan(UUID id) { return studyPlanRepository.findById(id); }
    public List<StudyPlan> getAllStudyPlans() { return studyPlanRepository.findAll(); }
    public void deleteStudyPlan(UUID id) { studyPlanRepository.deleteById(id); }

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
    public Optional<Flashcard> getFlashcard(UUID id) { return flashcardRepository.findById(id); }
    public List<Flashcard> getAllFlashcards() { return flashcardRepository.findAll(); }
    public void deleteFlashcard(UUID id) { flashcardRepository.deleteById(id); }

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
    public Optional<VivaAttempt> getVivaAttempt(UUID id) { return vivaAttemptRepository.findById(id); }
    public List<VivaAttempt> getAllVivaAttempts() { return vivaAttemptRepository.findAll(); }
    public void deleteVivaAttempt(UUID id) { vivaAttemptRepository.deleteById(id); }

    public ChatSession saveChatSession(ChatSessionDto dto) {
        ChatSession entity = new ChatSession();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPlanId(dto.getPlanId());
        entity.setSubjectId(dto.getSubjectId());
        entity.setTitle(dto.getTitle());
        return chatSessionRepository.save(entity);
    }
    public Optional<ChatSession> getChatSession(UUID id) { return chatSessionRepository.findById(id); }
    public List<ChatSession> getAllChatSessions() { return chatSessionRepository.findAll(); }
    public void deleteChatSession(UUID id) { chatSessionRepository.deleteById(id); }

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
    public Optional<ChatMessage> getChatMessage(UUID id) { return chatMessageRepository.findById(id); }
    public List<ChatMessage> getAllChatMessages() { return chatMessageRepository.findAll(); }
    public void deleteChatMessage(UUID id) { chatMessageRepository.deleteById(id); }

    public PyqPaper savePyqPaper(PyqPaperDto dto) {
        PyqPaper entity = new PyqPaper();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setSubject(dto.getSubject());
        entity.setPaperText(dto.getPaperText());
        return pyqPaperRepository.save(entity);
    }
    public Optional<PyqPaper> getPyqPaper(UUID id) { return pyqPaperRepository.findById(id); }
    public List<PyqPaper> getAllPyqPapers() { return pyqPaperRepository.findAll(); }
    public void deletePyqPaper(UUID id) { pyqPaperRepository.deleteById(id); }

    public PyqAnalysis savePyqAnalysis(PyqAnalysisDto dto) {
        PyqAnalysis entity = new PyqAnalysis();
        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setPaperId(dto.getPaperId());
        entity.setSubject(dto.getSubject());
        entity.setAnalysisData(dto.getAnalysisData());
        return pyqAnalysisRepository.save(entity);
    }
    public Optional<PyqAnalysis> getPyqAnalysis(UUID id) { return pyqAnalysisRepository.findById(id); }
    public List<PyqAnalysis> getAllPyqAnalyses() { return pyqAnalysisRepository.findAll(); }
    public void deletePyqAnalysis(UUID id) { pyqAnalysisRepository.deleteById(id); }

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
    public Optional<ReadinessScore> getReadinessScore(UUID id) { return readinessScoreRepository.findById(id); }
    public List<ReadinessScore> getAllReadinessScores() { return readinessScoreRepository.findAll(); }
    public void deleteReadinessScore(UUID id) { readinessScoreRepository.deleteById(id); }
}
