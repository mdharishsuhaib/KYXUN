package com.kyxun.task.service.impl;

import com.kyxun.common.enums.Priority;
import com.kyxun.common.enums.Status;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.Task;
import com.kyxun.entity.User;
import com.kyxun.subject.entity.Subject;
import com.kyxun.subject.repository.SubjectRepository;
import com.kyxun.task.dto.request.CreateTaskRequest;
import com.kyxun.task.dto.request.UpdateTaskRequest;
import com.kyxun.task.dto.response.TaskResponse;
import com.kyxun.task.mapper.TaskMapper;
import com.kyxun.task.repository.TaskRepository;
import com.kyxun.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final SubjectRepository subjectRepository;
    private final TaskMapper taskMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public TaskResponse create(CreateTaskRequest request) {
        User user = securityUtils.getCurrentUser();

        Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        Task task = Task.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .estimatedMinutes(request.getEstimatedMinutes())
                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                .status(Status.PENDING)
                .build();

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    public PagedResponse<TaskResponse> getAll(int page, int size, String sortBy, String sortDir) {
        User user = securityUtils.getCurrentUser();
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Task> taskPage = taskRepository.findByUser(user, pageable);
        return buildPagedResponse(taskPage);
    }

    @Override
    public PagedResponse<TaskResponse> getByStatus(Status status, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        Page<Task> taskPage = taskRepository.findByUserAndStatus(user, status, pageable);
        return buildPagedResponse(taskPage);
    }

    @Override
    public PagedResponse<TaskResponse> getByPriority(Priority priority, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        Page<Task> taskPage = taskRepository.findByUserAndPriority(user, priority, pageable);
        return buildPagedResponse(taskPage);
    }

    @Override
    public PagedResponse<TaskResponse> getBySubject(UUID subjectId, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Subject subject = subjectRepository.findByIdAndUser(subjectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        Page<Task> taskPage = taskRepository.findByUserAndSubject(user, subject, pageable);
        return buildPagedResponse(taskPage);
    }

    @Override
    public TaskResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        return taskMapper.toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse update(UUID id, UpdateTaskRequest request) {
        User user = securityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getEstimatedMinutes() != null) task.setEstimatedMinutes(request.getEstimatedMinutes());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            task.setSubject(subject);
        }

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse markComplete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        task.setStatus(Status.COMPLETED);
        task.setCompletedAt(OffsetDateTime.now());
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse markIncomplete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        task.setStatus(Status.PENDING);
        task.setCompletedAt(null);
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        taskRepository.delete(task);
    }

    private PagedResponse<TaskResponse> buildPagedResponse(Page<Task> page) {
        return PagedResponse.<TaskResponse>builder()
                .content(page.getContent().stream().map(taskMapper::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
