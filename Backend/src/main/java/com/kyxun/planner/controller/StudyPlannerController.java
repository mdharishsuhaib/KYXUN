package com.kyxun.planner.controller;

import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.planner.dto.request.CompleteStudySessionRequest;
import com.kyxun.planner.dto.request.CreateStudySessionRequest;
import com.kyxun.planner.dto.response.StudySessionResponse;
import com.kyxun.planner.service.StudyPlannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/planner")
@RequiredArgsConstructor
public class StudyPlannerController {

    private final StudyPlannerService studyPlannerService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StudySessionResponse> create(@Valid @RequestBody CreateStudySessionRequest request) {
        return ApiResponseBuilder.success("Study session created", studyPlannerService.create(request));
    }

    @GetMapping
    public ApiResponse<List<StudySessionResponse>> getAll() {
        return ApiResponseBuilder.success("Study sessions fetched", studyPlannerService.getAll());
    }

    @GetMapping("/date/{date}")
    public ApiResponse<List<StudySessionResponse>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponseBuilder.success("Sessions for date fetched", studyPlannerService.getByDate(date));
    }

    @GetMapping("/week")
    public ApiResponse<List<StudySessionResponse>> getByWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ApiResponseBuilder.success("Weekly sessions fetched", studyPlannerService.getByWeek(weekStart));
    }

    @GetMapping("/{id}")
    public ApiResponse<StudySessionResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Study session fetched", studyPlannerService.get(id));
    }

    @PatchMapping("/{id}/complete")
    public ApiResponse<StudySessionResponse> complete(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteStudySessionRequest request) {
        return ApiResponseBuilder.success("Study session completed", studyPlannerService.complete(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        studyPlannerService.delete(id);
        return ApiResponseBuilder.success("Study session deleted");
    }
}
