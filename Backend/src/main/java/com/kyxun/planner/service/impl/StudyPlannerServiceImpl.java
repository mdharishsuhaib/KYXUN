package com.kyxun.planner.service.impl;

import com.kyxun.common.enums.PlannerStatus;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.Task;
import com.kyxun.entity.User;
import com.kyxun.planner.dto.request.CompleteStudySessionRequest;
import com.kyxun.planner.dto.request.CreateStudySessionRequest;
import com.kyxun.planner.dto.response.StudySessionResponse;
import com.kyxun.planner.entity.StudySession;
import com.kyxun.planner.mapper.StudySessionMapper;
import com.kyxun.planner.repository.StudySessionRepository;
import com.kyxun.planner.service.StudyPlannerService;
import com.kyxun.subject.entity.Subject;
import com.kyxun.subject.repository.SubjectRepository;
import com.kyxun.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private final StudySessionRepository studySessionRepository;
    private final SubjectRepository subjectRepository;
    private final TaskRepository taskRepository;
    private final StudySessionMapper studySessionMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public StudySessionResponse create(CreateStudySessionRequest request) {
        User user = securityUtils.getCurrentUser();

        StudySession.StudySessionBuilder<?, ?> builder = StudySession.builder()
                .user(user)
                .title(request.getTitle())
                .plannedDate(request.getPlannedDate())
                .durationMinutes(request.getDurationMinutes())
                .notes(request.getNotes())
                .status(PlannerStatus.PLANNED);

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            builder.subject(subject);
        }

        if (request.getTaskId() != null) {
            Task task = taskRepository.findByIdAndUser(request.getTaskId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
            builder.task(task);
        }

        return studySessionMapper.toResponse(studySessionRepository.save(builder.build()));
    }

    @Override
    public List<StudySessionResponse> getAll() {
        User user = securityUtils.getCurrentUser();
        return studySessionRepository.findByUserOrderByPlannedDateAsc(user).stream()
                .map(studySessionMapper::toResponse).toList();
    }

    @Override
    public List<StudySessionResponse> getByDate(LocalDate date) {
        User user = securityUtils.getCurrentUser();
        return studySessionRepository.findByUserAndPlannedDate(user, date).stream()
                .map(studySessionMapper::toResponse).toList();
    }

    @Override
    public List<StudySessionResponse> getByWeek(LocalDate weekStart) {
        User user = securityUtils.getCurrentUser();
        LocalDate weekEnd = weekStart.plusDays(6);
        return studySessionRepository.findByUserAndPlannedDateBetween(user, weekStart, weekEnd).stream()
                .map(studySessionMapper::toResponse).toList();
    }

    @Override
    public StudySessionResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        return studySessionMapper.toResponse(
                studySessionRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new ResourceNotFoundException("Study session not found")));
    }

    @Override
    @Transactional
    public StudySessionResponse complete(UUID id, CompleteStudySessionRequest request) {
        User user = securityUtils.getCurrentUser();
        StudySession session = studySessionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found"));
        session.setStatus(PlannerStatus.COMPLETED);
        session.setActualDurationMinutes(request.getActualDurationMinutes());
        if (request.getNotes() != null) session.setNotes(request.getNotes());
        return studySessionMapper.toResponse(studySessionRepository.save(session));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        StudySession session = studySessionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found"));
        studySessionRepository.delete(session);
    }
}
