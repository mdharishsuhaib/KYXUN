package com.kyxun.examination.controller;

import com.kyxun.common.constants.AppConstants;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.examination.dto.request.CreateExaminationRequest;
import com.kyxun.examination.dto.request.UpdateExaminationRequest;
import com.kyxun.examination.dto.response.ExamTopicPredictionResponse;
import com.kyxun.examination.dto.response.ExaminationResponse;
import com.kyxun.examination.entity.Examination.ExamType;
import com.kyxun.examination.service.ExaminationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/examinations")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExaminationResponse> create(
            @Valid @RequestBody CreateExaminationRequest request) {
        return ApiResponseBuilder.success("Examination created successfully",
                examinationService.create(request));
    }

    @GetMapping
    public ApiResponse<PagedResponse<ExaminationResponse>> getAll(
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Examinations fetched successfully",
                examinationService.getAll(page, size));
    }

    @GetMapping("/upcoming")
    public ApiResponse<List<ExaminationResponse>> getUpcoming() {
        return ApiResponseBuilder.success("Upcoming examinations fetched",
                examinationService.getUpcoming());
    }

    @GetMapping("/semester/{semesterId}")
    public ApiResponse<PagedResponse<ExaminationResponse>> getBySemester(
            @PathVariable UUID semesterId,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Examinations fetched by semester",
                examinationService.getBySemester(semesterId, page, size));
    }

    @GetMapping("/subject/{subjectId}")
    public ApiResponse<PagedResponse<ExaminationResponse>> getBySubject(
            @PathVariable UUID subjectId,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Examinations fetched by subject",
                examinationService.getBySubject(subjectId, page, size));
    }

    @GetMapping("/type/{examType}")
    public ApiResponse<PagedResponse<ExaminationResponse>> getByType(
            @PathVariable ExamType examType,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Examinations fetched by type",
                examinationService.getByType(examType, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExaminationResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Examination fetched successfully",
                examinationService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<ExaminationResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExaminationRequest request) {
        return ApiResponseBuilder.success("Examination updated successfully",
                examinationService.update(id, request));
    }

    @PatchMapping("/{id}/result")
    public ApiResponse<ExaminationResponse> recordResult(
            @PathVariable UUID id,
            @RequestParam Integer marksObtained) {
        return ApiResponseBuilder.success("Result recorded successfully",
                examinationService.recordResult(id, marksObtained));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        examinationService.delete(id);
        return ApiResponseBuilder.success("Examination deleted successfully");
    }

    /**
     * AI-powered endpoint: Predicts high-probability topics for an upcoming exam.
     */
    @GetMapping("/predict-topics")
    public ApiResponse<ExamTopicPredictionResponse> predictTopics(
            @RequestParam UUID subjectId,
            @RequestParam ExamType examType) {
        return ApiResponseBuilder.success("Topic prediction generated successfully",
                examinationService.predictTopics(subjectId, examType));
    }
}
