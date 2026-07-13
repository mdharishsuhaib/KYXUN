package com.kyxun.semester.controller;

import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.semester.dto.request.CreateSemesterRequest;
import com.kyxun.semester.dto.request.UpdateSemesterRequest;
import com.kyxun.semester.dto.response.SemesterResponse;
import com.kyxun.semester.service.SemesterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SemesterResponse> create(@Valid @RequestBody CreateSemesterRequest request) {
        return ApiResponseBuilder.success("Semester created successfully", semesterService.create(request));
    }

    @GetMapping
    public ApiResponse<List<SemesterResponse>> getAll() {
        return ApiResponseBuilder.success("Semesters fetched successfully", semesterService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SemesterResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Semester fetched successfully", semesterService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<SemesterResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSemesterRequest request) {
        return ApiResponseBuilder.success("Semester updated successfully", semesterService.update(id, request));
    }

    @PatchMapping("/{id}/activate")
    public ApiResponse<SemesterResponse> activate(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Semester activated", semesterService.setActive(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        semesterService.delete(id);
        return ApiResponseBuilder.success("Semester deleted successfully");
    }
}
