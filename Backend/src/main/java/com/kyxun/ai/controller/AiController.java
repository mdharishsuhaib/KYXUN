package com.kyxun.ai.controller;

import com.kyxun.ai.entity.*;
import com.kyxun.ai.dto.*;
import com.kyxun.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {
    private final AiService aiService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PostMapping("/study-plans")
    public ResponseEntity<StudyPlan> createStudyPlan(@RequestBody StudyPlanDto dto) {
        return ResponseEntity.ok(aiService.saveStudyPlan(dto));
    }
    @GetMapping("/study-plans/{id}")
    public ResponseEntity<StudyPlan> getStudyPlan(@PathVariable UUID id) {
        return aiService.getStudyPlan(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/study-plans")
    public ResponseEntity<List<StudyPlan>> getAllStudyPlans() {
        return ResponseEntity.ok(aiService.getAllStudyPlans());
    }
    @DeleteMapping("/study-plans/{id}")
    public ResponseEntity<Void> deleteStudyPlan(@PathVariable UUID id) {
        aiService.deleteStudyPlan(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/flashcards")
    public ResponseEntity<Flashcard> createFlashcard(@RequestBody FlashcardDto dto) {
        return ResponseEntity.ok(aiService.saveFlashcard(dto));
    }
    @GetMapping("/flashcards/{id}")
    public ResponseEntity<Flashcard> getFlashcard(@PathVariable UUID id) {
        return aiService.getFlashcard(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/flashcards")
    public ResponseEntity<List<Flashcard>> getAllFlashcards() {
        return ResponseEntity.ok(aiService.getAllFlashcards());
    }
    @DeleteMapping("/flashcards/{id}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable UUID id) {
        aiService.deleteFlashcard(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/viva-attempts")
    public ResponseEntity<VivaAttempt> createVivaAttempt(@RequestBody VivaAttemptDto dto) {
        return ResponseEntity.ok(aiService.saveVivaAttempt(dto));
    }
    @GetMapping("/viva-attempts/{id}")
    public ResponseEntity<VivaAttempt> getVivaAttempt(@PathVariable UUID id) {
        return aiService.getVivaAttempt(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/viva-attempts")
    public ResponseEntity<List<VivaAttempt>> getAllVivaAttempts() {
        return ResponseEntity.ok(aiService.getAllVivaAttempts());
    }
    @DeleteMapping("/viva-attempts/{id}")
    public ResponseEntity<Void> deleteVivaAttempt(@PathVariable UUID id) {
        aiService.deleteVivaAttempt(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat-sessions")
    public ResponseEntity<ChatSession> createChatSession(@RequestBody ChatSessionDto dto) {
        return ResponseEntity.ok(aiService.saveChatSession(dto));
    }
    @GetMapping("/chat-sessions/{id}")
    public ResponseEntity<ChatSession> getChatSession(@PathVariable UUID id) {
        return aiService.getChatSession(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/chat-sessions")
    public ResponseEntity<List<ChatSession>> getAllChatSessions() {
        return ResponseEntity.ok(aiService.getAllChatSessions());
    }
    @DeleteMapping("/chat-sessions/{id}")
    public ResponseEntity<Void> deleteChatSession(@PathVariable UUID id) {
        aiService.deleteChatSession(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat-messages")
    public ResponseEntity<ChatMessage> createChatMessage(@RequestBody ChatMessageDto dto) {
        return ResponseEntity.ok(aiService.saveChatMessage(dto));
    }
    @GetMapping("/chat-messages/{id}")
    public ResponseEntity<ChatMessage> getChatMessage(@PathVariable UUID id) {
        return aiService.getChatMessage(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/chat-messages")
    public ResponseEntity<List<ChatMessage>> getAllChatMessages() {
        return ResponseEntity.ok(aiService.getAllChatMessages());
    }
    @DeleteMapping("/chat-messages/{id}")
    public ResponseEntity<Void> deleteChatMessage(@PathVariable UUID id) {
        aiService.deleteChatMessage(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/pyq-papers")
    public ResponseEntity<PyqPaper> createPyqPaper(@RequestBody PyqPaperDto dto) {
        return ResponseEntity.ok(aiService.savePyqPaper(dto));
    }
    @GetMapping("/pyq-papers/{id}")
    public ResponseEntity<PyqPaper> getPyqPaper(@PathVariable UUID id) {
        return aiService.getPyqPaper(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/pyq-papers")
    public ResponseEntity<List<PyqPaper>> getAllPyqPapers() {
        return ResponseEntity.ok(aiService.getAllPyqPapers());
    }
    @DeleteMapping("/pyq-papers/{id}")
    public ResponseEntity<Void> deletePyqPaper(@PathVariable UUID id) {
        aiService.deletePyqPaper(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/pyq-analyses")
    public ResponseEntity<PyqAnalysis> createPyqAnalysis(@RequestBody PyqAnalysisDto dto) {
        return ResponseEntity.ok(aiService.savePyqAnalysis(dto));
    }
    @GetMapping("/pyq-analyses/{id}")
    public ResponseEntity<PyqAnalysis> getPyqAnalysis(@PathVariable UUID id) {
        return aiService.getPyqAnalysis(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/pyq-analyses")
    public ResponseEntity<List<PyqAnalysis>> getAllPyqAnalyses() {
        return ResponseEntity.ok(aiService.getAllPyqAnalyses());
    }
    @DeleteMapping("/pyq-analyses/{id}")
    public ResponseEntity<Void> deletePyqAnalysis(@PathVariable UUID id) {
        aiService.deletePyqAnalysis(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/readiness-scores")
    public ResponseEntity<ReadinessScore> createReadinessScore(@RequestBody ReadinessScoreDto dto) {
        return ResponseEntity.ok(aiService.saveReadinessScore(dto));
    }
    @GetMapping("/readiness-scores/{id}")
    public ResponseEntity<ReadinessScore> getReadinessScore(@PathVariable UUID id) {
        return aiService.getReadinessScore(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/readiness-scores")
    public ResponseEntity<List<ReadinessScore>> getAllReadinessScores() {
        return ResponseEntity.ok(aiService.getAllReadinessScores());
    }
    @DeleteMapping("/readiness-scores/{id}")
    public ResponseEntity<Void> deleteReadinessScore(@PathVariable UUID id) {
        aiService.deleteReadinessScore(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/stream/chat")
    public SseEmitter streamChat(@RequestBody StreamRequestDto request) {
        SseEmitter emitter = new SseEmitter();
        executor.execute(() -> {
            try {
                emitter.send(SseEmitter.event().data("Generating response for: " + request.getMessage()));
                Thread.sleep(500);
                emitter.send(SseEmitter.event().data("Response part 1"));
                Thread.sleep(500);
                emitter.send(SseEmitter.event().data("Response part 2"));
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });
        return emitter;
    }
}
