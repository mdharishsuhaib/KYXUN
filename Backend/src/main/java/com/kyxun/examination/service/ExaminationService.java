package com.kyxun.examination.service;

import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.examination.dto.request.CreateExaminationRequest;
import com.kyxun.examination.dto.request.UpdateExaminationRequest;
import com.kyxun.examination.dto.response.ExamTopicPredictionResponse;
import com.kyxun.examination.dto.response.ExaminationResponse;
import com.kyxun.examination.entity.Examination.ExamType;

import java.util.List;
import java.util.UUID;

public interface ExaminationService {

    ExaminationResponse create(CreateExaminationRequest request);

    PagedResponse<ExaminationResponse> getAll(int page, int size);

    PagedResponse<ExaminationResponse> getBySemester(UUID semesterId, int page, int size);

    PagedResponse<ExaminationResponse> getBySubject(UUID subjectId, int page, int size);

    PagedResponse<ExaminationResponse> getByType(ExamType examType, int page, int size);

    List<ExaminationResponse> getUpcoming();

    ExaminationResponse get(UUID id);

    ExaminationResponse update(UUID id, UpdateExaminationRequest request);

    ExaminationResponse recordResult(UUID id, Integer marksObtained);

    void delete(UUID id);

    ExamTopicPredictionResponse predictTopics(UUID subjectId, ExamType examType);
}
