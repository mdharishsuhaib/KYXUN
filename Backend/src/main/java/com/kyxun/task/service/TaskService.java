package com.kyxun.task.service;

import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.task.dto.request.CreateTaskRequest;
import com.kyxun.task.dto.request.UpdateTaskRequest;
import com.kyxun.task.dto.response.TaskResponse;

import java.util.UUID;

public interface TaskService {

    TaskResponse create(CreateTaskRequest request);

    PagedResponse<TaskResponse> getAll(int page, int size, String sortBy, String sortDir);

    PagedResponse<TaskResponse> getByStatus(Status status, int page, int size);

    PagedResponse<TaskResponse> getByPriority(Priority priority, int page, int size);

    PagedResponse<TaskResponse> getBySubject(UUID subjectId, int page, int size);

    TaskResponse get(UUID id);

    TaskResponse update(UUID id, UpdateTaskRequest request);

    TaskResponse markComplete(UUID id);

    TaskResponse markIncomplete(UUID id);

    void delete(UUID id);
}
