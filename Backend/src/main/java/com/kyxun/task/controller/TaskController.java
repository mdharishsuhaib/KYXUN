package com.kyxun.task.controller;

import com.kyxun.common.constants.AppConstants;
import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.task.dto.request.CreateTaskRequest;
import com.kyxun.task.dto.request.UpdateTaskRequest;
import com.kyxun.task.dto.response.TaskResponse;
import com.kyxun.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) {
        return ApiResponseBuilder.success("Task created successfully", taskService.create(request));
    }

    @GetMapping
    public ApiResponse<PagedResponse<TaskResponse>> getAll(
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_BY) String sortBy,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_DIR) String sortDir) {
        return ApiResponseBuilder.success("Tasks fetched successfully",
                taskService.getAll(page, size, sortBy, sortDir));
    }

    @GetMapping("/status/{status}")
    public ApiResponse<PagedResponse<TaskResponse>> getByStatus(
            @PathVariable Status status,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Tasks fetched by status",
                taskService.getByStatus(status, page, size));
    }

    @GetMapping("/priority/{priority}")
    public ApiResponse<PagedResponse<TaskResponse>> getByPriority(
            @PathVariable Priority priority,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Tasks fetched by priority",
                taskService.getByPriority(priority, page, size));
    }

    @GetMapping("/subject/{subjectId}")
    public ApiResponse<PagedResponse<TaskResponse>> getBySubject(
            @PathVariable UUID subjectId,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Tasks fetched by subject",
                taskService.getBySubject(subjectId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Task fetched successfully", taskService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ApiResponseBuilder.success("Task updated successfully", taskService.update(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ApiResponse<TaskResponse> markComplete(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Task marked as complete", taskService.markComplete(id));
    }

    @PatchMapping("/{id}/incomplete")
    public ApiResponse<TaskResponse> markIncomplete(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Task marked as incomplete", taskService.markIncomplete(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        taskService.delete(id);
        return ApiResponseBuilder.success("Task deleted successfully");
    }
}
