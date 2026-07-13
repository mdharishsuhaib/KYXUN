package com.kyxun.task.service;

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
import com.kyxun.task.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private TaskMapper taskMapper;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks
    private TaskServiceImpl taskService;

    private User mockUser;
    private Subject mockSubject;
    private Task mockTask;
    private TaskResponse mockTaskResponse;
    private UUID taskId;
    private UUID subjectId;

    @BeforeEach
    void setUp() {
        taskId    = UUID.randomUUID();
        subjectId = UUID.randomUUID();

        mockUser = User.builder()
                .email("student@kyxun.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockSubject = Subject.builder()
                .name("Data Structures")
                .build();

        mockTask = Task.builder()
                .user(mockUser)
                .subject(mockSubject)
                .title("Study Graphs")
                .priority(Priority.HIGH)
                .status(Status.PENDING)
                .build();

        mockTaskResponse = TaskResponse.builder()
                .id(taskId)
                .title("Study Graphs")
                .priority(Priority.HIGH)
                .status(Status.PENDING)
                .build();
    }

    @Test
    void create_shouldSaveAndReturnTask() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Study Graphs");
        request.setSubjectId(subjectId);
        request.setPriority(Priority.HIGH);

        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(subjectRepository.findByIdAndUser(subjectId, mockUser))
                .thenReturn(Optional.of(mockSubject));
        when(taskRepository.save(any(Task.class))).thenReturn(mockTask);
        when(taskMapper.toResponse(mockTask)).thenReturn(mockTaskResponse);

        TaskResponse result = taskService.create(request);

        assertThat(result.getTitle()).isEqualTo("Study Graphs");
        assertThat(result.getPriority()).isEqualTo(Priority.HIGH);
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void create_shouldThrowWhenSubjectNotFound() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Study Graphs");
        request.setSubjectId(subjectId);

        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(subjectRepository.findByIdAndUser(subjectId, mockUser))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).save(any());
    }

    @Test
    void get_shouldReturnTaskWhenFound() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(taskRepository.findByIdAndUser(taskId, mockUser))
                .thenReturn(Optional.of(mockTask));
        when(taskMapper.toResponse(mockTask)).thenReturn(mockTaskResponse);

        TaskResponse result = taskService.get(taskId);

        assertThat(result.getId()).isEqualTo(taskId);
        assertThat(result.getTitle()).isEqualTo("Study Graphs");
    }

    @Test
    void get_shouldThrowWhenTaskNotFound() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(taskRepository.findByIdAndUser(taskId, mockUser))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.get(taskId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    void markComplete_shouldSetStatusAndCompletedAt() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(taskRepository.findByIdAndUser(taskId, mockUser))
                .thenReturn(Optional.of(mockTask));
        when(taskRepository.save(any())).thenReturn(mockTask);
        when(taskMapper.toResponse(mockTask)).thenReturn(
                TaskResponse.builder()
                        .id(taskId)
                        .title("Study Graphs")
                        .priority(Priority.HIGH)
                        .status(Status.COMPLETED)
                        .build()
        );

        TaskResponse result = taskService.markComplete(taskId);

        assertThat(mockTask.getStatus()).isEqualTo(Status.COMPLETED);
        assertThat(mockTask.getCompletedAt()).isNotNull();
    }

    @Test
    void markIncomplete_shouldResetStatusAndClearCompletedAt() {
        mockTask.setStatus(Status.COMPLETED);
        mockTask.setCompletedAt(OffsetDateTime.now());

        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(taskRepository.findByIdAndUser(taskId, mockUser))
                .thenReturn(Optional.of(mockTask));
        when(taskRepository.save(any())).thenReturn(mockTask);
        when(taskMapper.toResponse(mockTask)).thenReturn(mockTaskResponse);

        taskService.markIncomplete(taskId);

        assertThat(mockTask.getStatus()).isEqualTo(Status.PENDING);
        assertThat(mockTask.getCompletedAt()).isNull();
    }

    @Test
    void delete_shouldCallRepositoryDelete() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(taskRepository.findByIdAndUser(taskId, mockUser))
                .thenReturn(Optional.of(mockTask));

        taskService.delete(taskId);

        verify(taskRepository).delete(mockTask);
    }

    @Test
    void getAll_shouldReturnPagedResponse() {
        Page<Task> page = new PageImpl<>(List.of(mockTask));
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(taskRepository.findByUser(eq(mockUser), any(Pageable.class))).thenReturn(page);
        when(taskMapper.toResponse(mockTask)).thenReturn(mockTaskResponse);

        PagedResponse<TaskResponse> result = taskService.getAll(0, 10, "dueDate", "asc");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }
}
