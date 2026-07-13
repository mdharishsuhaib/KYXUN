package com.kyxun.planner.service;

import com.kyxun.planner.dto.request.CompleteStudySessionRequest;
import com.kyxun.planner.dto.request.CreateStudySessionRequest;
import com.kyxun.planner.dto.response.StudySessionResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StudyPlannerService {

    StudySessionResponse create(CreateStudySessionRequest request);

    List<StudySessionResponse> getAll();

    List<StudySessionResponse> getByDate(LocalDate date);

    List<StudySessionResponse> getByWeek(LocalDate weekStart);

    StudySessionResponse get(UUID id);

    StudySessionResponse complete(UUID id, CompleteStudySessionRequest request);

    void delete(UUID id);
}
