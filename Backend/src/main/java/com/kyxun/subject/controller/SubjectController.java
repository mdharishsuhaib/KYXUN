package com.kyxun.subject.controller;

import com.kyxun.common.response.ApiResponse;
import com.kyxun.subject.dto.request.CreateSubjectRequest;
import com.kyxun.subject.dto.request.UpdateSubjectRequest;
import com.kyxun.subject.dto.response.SubjectResponse;
import com.kyxun.subject.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    public ApiResponse<SubjectResponse> create(
            @Valid @RequestBody CreateSubjectRequest request) {

        return ApiResponse.<SubjectResponse>builder()
                .success(true)
                .message("Subject created successfully.")
                .data(subjectService.create(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<SubjectResponse>> getAll() {

        return ApiResponse.<List<SubjectResponse>>builder()
                .success(true)
                .message("Subjects fetched successfully.")
                .data(subjectService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SubjectResponse> get(
            @PathVariable UUID id) {

        return ApiResponse.<SubjectResponse>builder()
                .success(true)
                .message("Subject fetched successfully.")
                .data(subjectService.get(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SubjectResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubjectRequest request) {

        return ApiResponse.<SubjectResponse>builder()
                .success(true)
                .message("Subject updated successfully.")
                .data(subjectService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable UUID id) {

        subjectService.delete(id);

        return ApiResponse.<Void>builder()
                .success(true)
                .message("Subject deleted successfully.")
                .build();
    }
}