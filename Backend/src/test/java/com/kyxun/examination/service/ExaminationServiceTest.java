package com.kyxun.examination.service;

import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.User;
import com.kyxun.examination.dto.request.CreateExaminationRequest;
import com.kyxun.examination.dto.response.ExaminationResponse;
import com.kyxun.examination.entity.Examination;
import com.kyxun.examination.entity.Examination.ExamType;
import com.kyxun.examination.mapper.ExaminationMapper;
import com.kyxun.examination.repository.ExaminationRepository;
import com.kyxun.examination.service.impl.ExaminationServiceImpl;
import com.kyxun.semester.repository.SemesterRepository;
import com.kyxun.subject.entity.Subject;
import com.kyxun.subject.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExaminationServiceTest {

    @Mock private ExaminationRepository examinationRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private SemesterRepository semesterRepository;
    @Mock private ExaminationMapper examinationMapper;
    @Mock private SecurityUtils securityUtils;
    @Mock private ChatClient chatClient;

    @InjectMocks
    private ExaminationServiceImpl examinationService;

    private User mockUser;
    private Subject mockSubject;
    private Examination mockExam;
    private ExaminationResponse mockResponse;
    private UUID examId;
    private UUID subjectId;

    @BeforeEach
    void setUp() {
        examId    = UUID.randomUUID();
        subjectId = UUID.randomUUID();

        mockUser = User.builder()
                .email("student@kyxun.com")
                .firstName("Jane")
                .lastName("Smith")
                .build();

        mockSubject = Subject.builder()
                .name("Operating Systems")
                .build();

        mockExam = Examination.builder()
                .user(mockUser)
                .subject(mockSubject)
                .title("OS Semester Exam")
                .examType(ExamType.SEMESTER_EXAM)
                .examDate(LocalDate.now().plusDays(10))
                .startTime(LocalTime.of(9, 0))
                .maxMarks(100)
                .passingMarks(50)
                .build();

        mockResponse = ExaminationResponse.builder()
                .id(examId)
                .subjectName("Operating Systems")
                .title("OS Semester Exam")
                .examType(ExamType.SEMESTER_EXAM)
                .examDate(LocalDate.now().plusDays(10))
                .maxMarks(100)
                .passingMarks(50)
                .build();
    }

    @Test
    void create_shouldSaveAndReturnExamination() {
        CreateExaminationRequest request = new CreateExaminationRequest();
        request.setSubjectId(subjectId);
        request.setTitle("OS Semester Exam");
        request.setExamType(ExamType.SEMESTER_EXAM);
        request.setExamDate(LocalDate.now().plusDays(10));
        request.setMaxMarks(100);
        request.setPassingMarks(50);

        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(subjectRepository.findByIdAndUser(subjectId, mockUser))
                .thenReturn(Optional.of(mockSubject));
        when(examinationRepository.save(any())).thenReturn(mockExam);
        when(examinationMapper.toResponse(mockExam)).thenReturn(mockResponse);

        ExaminationResponse result = examinationService.create(request);

        assertThat(result.getTitle()).isEqualTo("OS Semester Exam");
        assertThat(result.getExamType()).isEqualTo(ExamType.SEMESTER_EXAM);
        verify(examinationRepository).save(any(Examination.class));
    }

    @Test
    void create_shouldThrowWhenSubjectNotFound() {
        CreateExaminationRequest request = new CreateExaminationRequest();
        request.setSubjectId(subjectId);
        request.setTitle("Test");
        request.setExamType(ExamType.MODEL_EXAM);
        request.setExamDate(LocalDate.now().plusDays(5));

        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(subjectRepository.findByIdAndUser(subjectId, mockUser))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> examinationService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Subject not found");
        verify(examinationRepository, never()).save(any());
    }

    @Test
    void get_shouldReturnExaminationById() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(examinationRepository.findByIdAndUser(examId, mockUser))
                .thenReturn(Optional.of(mockExam));
        when(examinationMapper.toResponse(mockExam)).thenReturn(mockResponse);

        ExaminationResponse result = examinationService.get(examId);

        assertThat(result.getId()).isEqualTo(examId);
    }

    @Test
    void get_shouldThrowWhenNotFound() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(examinationRepository.findByIdAndUser(examId, mockUser))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> examinationService.get(examId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void recordResult_shouldSetMarksObtained() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(examinationRepository.findByIdAndUser(examId, mockUser))
                .thenReturn(Optional.of(mockExam));
        when(examinationRepository.save(any())).thenReturn(mockExam);
        when(examinationMapper.toResponse(mockExam)).thenReturn(
                ExaminationResponse.builder()
                        .id(examId)
                        .subjectName("Operating Systems")
                        .title("OS Semester Exam")
                        .examType(ExamType.SEMESTER_EXAM)
                        .examDate(LocalDate.now().plusDays(10))
                        .maxMarks(100)
                        .passingMarks(50)
                        .marksObtained(75)
                        .passed(true)
                        .build()
        );

        ExaminationResponse result = examinationService.recordResult(examId, 75);

        assertThat(mockExam.getMarksObtained()).isEqualTo(75);
        verify(examinationRepository).save(mockExam);
    }

    @Test
    void getUpcoming_shouldReturnFutureExams() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(examinationRepository.findUpcoming(eq(mockUser), any(LocalDate.class)))
                .thenReturn(List.of(mockExam));
        when(examinationMapper.toResponse(mockExam)).thenReturn(mockResponse);

        List<ExaminationResponse> result = examinationService.getUpcoming();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("OS Semester Exam");
    }

    @Test
    void delete_shouldRemoveExamination() {
        when(securityUtils.getCurrentUser()).thenReturn(mockUser);
        when(examinationRepository.findByIdAndUser(examId, mockUser))
                .thenReturn(Optional.of(mockExam));

        examinationService.delete(examId);

        verify(examinationRepository).delete(mockExam);
    }
}
