package com.kyxun.examination.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.User;
import com.kyxun.examination.dto.request.CreateExaminationRequest;
import com.kyxun.examination.dto.request.UpdateExaminationRequest;
import com.kyxun.examination.dto.response.ExamTopicPredictionResponse;
import com.kyxun.examination.dto.response.ExaminationResponse;
import com.kyxun.examination.entity.Examination;
import com.kyxun.examination.entity.Examination.ExamType;
import com.kyxun.examination.mapper.ExaminationMapper;
import com.kyxun.examination.repository.ExaminationRepository;
import com.kyxun.examination.service.ExaminationService;
import com.kyxun.semester.entity.Semester;
import com.kyxun.semester.repository.SemesterRepository;
import com.kyxun.subject.entity.Subject;
import com.kyxun.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExaminationServiceImpl implements ExaminationService {

    private final ExaminationRepository examinationRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final ExaminationMapper examinationMapper;
    private final SecurityUtils securityUtils;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ExaminationResponse create(CreateExaminationRequest request) {
        User user = securityUtils.getCurrentUser();

        Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        Semester semester = null;
        if (request.getSemesterId() != null) {
            semester = semesterRepository.findByIdAndUser(request.getSemesterId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        }

        Examination exam = Examination.builder()
                .user(user)
                .subject(subject)
                .semester(semester)
                .title(request.getTitle())
                .examType(request.getExamType())
                .examDate(request.getExamDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .venue(request.getVenue())
                .maxMarks(request.getMaxMarks())
                .passingMarks(request.getPassingMarks())
                .notes(request.getNotes())
                .build();

        return examinationMapper.toResponse(examinationRepository.save(exam));
    }

    @Override
    public PagedResponse<ExaminationResponse> getAll(int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("examDate").ascending());
        return buildPagedResponse(examinationRepository.findByUser(user, pageable));
    }

    @Override
    public PagedResponse<ExaminationResponse> getBySemester(UUID semesterId, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Semester semester = semesterRepository.findByIdAndUser(semesterId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("examDate").ascending());
        return buildPagedResponse(examinationRepository.findByUserAndSemester(user, semester, pageable));
    }

    @Override
    public PagedResponse<ExaminationResponse> getBySubject(UUID subjectId, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Subject subject = subjectRepository.findByIdAndUser(subjectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("examDate").ascending());
        return buildPagedResponse(examinationRepository.findByUserAndSubject(user, subject, pageable));
    }

    @Override
    public PagedResponse<ExaminationResponse> getByType(ExamType examType, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("examDate").ascending());
        return buildPagedResponse(examinationRepository.findByUserAndExamType(user, examType, pageable));
    }

    @Override
    public List<ExaminationResponse> getUpcoming() {
        User user = securityUtils.getCurrentUser();
        return examinationRepository.findUpcoming(user, LocalDate.now())
                .stream()
                .map(examinationMapper::toResponse)
                .toList();
    }

    @Override
    public ExaminationResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        Examination exam = examinationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        return examinationMapper.toResponse(exam);
    }

    @Override
    @Transactional
    public ExaminationResponse update(UUID id, UpdateExaminationRequest request) {
        User user = securityUtils.getCurrentUser();
        Examination exam = examinationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));

        if (request.getTitle() != null) exam.setTitle(request.getTitle());
        if (request.getExamType() != null) exam.setExamType(request.getExamType());
        if (request.getExamDate() != null) exam.setExamDate(request.getExamDate());
        if (request.getStartTime() != null) exam.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) exam.setEndTime(request.getEndTime());
        if (request.getVenue() != null) exam.setVenue(request.getVenue());
        if (request.getMaxMarks() != null) exam.setMaxMarks(request.getMaxMarks());
        if (request.getPassingMarks() != null) exam.setPassingMarks(request.getPassingMarks());
        if (request.getMarksObtained() != null) exam.setMarksObtained(request.getMarksObtained());
        if (request.getNotes() != null) exam.setNotes(request.getNotes());

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            exam.setSubject(subject);
        }
        if (request.getSemesterId() != null) {
            Semester semester = semesterRepository.findByIdAndUser(request.getSemesterId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
            exam.setSemester(semester);
        }

        return examinationMapper.toResponse(examinationRepository.save(exam));
    }

    @Override
    @Transactional
    public ExaminationResponse recordResult(UUID id, Integer marksObtained) {
        User user = securityUtils.getCurrentUser();
        Examination exam = examinationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        exam.setMarksObtained(marksObtained);
        return examinationMapper.toResponse(examinationRepository.save(exam));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Examination exam = examinationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        examinationRepository.delete(exam);
    }

    @Override
    public ExamTopicPredictionResponse predictTopics(UUID subjectId, ExamType examType) {
        User user = securityUtils.getCurrentUser();
        Subject subject = subjectRepository.findByIdAndUser(subjectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        String subjectName = subject.getName();
        String examTypeName = examType.name().replace("_", " ");

        String prompt = """
                You are an expert academic advisor for Indian college students.
                
                Subject: %s
                Exam Type: %s
                
                Based on standard Indian university curricula, predict the most important topics.
                
                Respond in this exact JSON format:
                {
                  "highPriorityTopics": ["topic1", "topic2"],
                  "mediumPriorityTopics": ["topic1", "topic2"],
                  "studyTips": ["tip1", "tip2"],
                  "aiSummary": "One paragraph summary."
                }
                """.formatted(subjectName, examTypeName);

        try {
            String aiResponse = chatClient.prompt().user(prompt).call().content();
            Map<String, Object> map = objectMapper.readValue(aiResponse, new TypeReference<>() {});
            
            return ExamTopicPredictionResponse.builder()
                    .subjectName(subjectName)
                    .examType(examTypeName)
                    .highPriorityTopics((List<String>) map.get("highPriorityTopics"))
                    .mediumPriorityTopics((List<String>) map.get("mediumPriorityTopics"))
                    .studyTips((List<String>) map.get("studyTips"))
                    .aiSummary((String) map.get("aiSummary"))
                    .build();
        } catch (Exception e) {
            log.error("AI prediction failed for subject {}: {}", subjectName, e.getMessage());
            return buildFallbackPrediction(subjectName, examTypeName);
        }
    }

    private ExamTopicPredictionResponse buildFallbackPrediction(String subjectName, String examTypeName) {
        return ExamTopicPredictionResponse.builder()
                .subjectName(subjectName)
                .examType(examTypeName)
                .highPriorityTopics(List.of("Review core syllabus", "Practice previous papers"))
                .mediumPriorityTopics(List.of("Review class notes", "Focus on common definitions"))
                .studyTips(List.of("Maintain a steady study schedule", "Prioritize high-weightage units"))
                .aiSummary("Focus on foundational concepts and previous year patterns to perform well.")
                .build();
    }

    private PagedResponse<ExaminationResponse> buildPagedResponse(Page<Examination> page) {
        return PagedResponse.<ExaminationResponse>builder()
                .content(page.getContent().stream().map(examinationMapper::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
