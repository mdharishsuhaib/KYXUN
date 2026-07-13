package com.kyxun.planner.mapper;

import com.kyxun.planner.dto.response.StudySessionResponse;
import com.kyxun.planner.entity.StudySession;
import org.springframework.stereotype.Component;

@Component
public class StudySessionMapper {

    public StudySessionResponse toResponse(StudySession session) {
        return StudySessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .plannedDate(session.getPlannedDate())
                .durationMinutes(session.getDurationMinutes())
                .actualDurationMinutes(session.getActualDurationMinutes())
                .status(session.getStatus())
                .notes(session.getNotes())
                .subjectId(session.getSubject() != null ? session.getSubject().getId() : null)
                .subjectName(session.getSubject() != null ? session.getSubject().getName() : null)
                .taskId(session.getTask() != null ? session.getTask().getId() : null)
                .taskTitle(session.getTask() != null ? session.getTask().getTitle() : null)
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
