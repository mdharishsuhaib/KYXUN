package com.kyxun.semester.service.impl;

import com.kyxun.common.exception.BadRequestException;
import com.kyxun.common.exception.ConflictException;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.User;
import com.kyxun.semester.dto.request.CreateSemesterRequest;
import com.kyxun.semester.dto.request.UpdateSemesterRequest;
import com.kyxun.semester.dto.response.SemesterResponse;
import com.kyxun.semester.entity.Semester;
import com.kyxun.semester.mapper.SemesterMapper;
import com.kyxun.semester.repository.SemesterRepository;
import com.kyxun.semester.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final SemesterMapper semesterMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public SemesterResponse create(CreateSemesterRequest request) {
        User user = securityUtils.getCurrentUser();

        if (semesterRepository.existsByUserAndName(user, request.getName())) {
            throw new ConflictException("A semester with this name already exists");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        Semester semester = Semester.builder()
                .user(user)
                .name(request.getName())
                .semesterType(request.getSemesterType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .academicYear(request.getAcademicYear())
                .isActive(request.getIsActive() != null ? request.getIsActive() : false)
                .build();

        return semesterMapper.toResponse(semesterRepository.save(semester));
    }

    @Override
    public List<SemesterResponse> getAll() {
        User user = securityUtils.getCurrentUser();
        return semesterRepository.findByUser(user).stream()
                .map(semesterMapper::toResponse).toList();
    }

    @Override
    public SemesterResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        return semesterMapper.toResponse(
                semesterRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new ResourceNotFoundException("Semester not found")));
    }

    @Override
    @Transactional
    public SemesterResponse update(UUID id, UpdateSemesterRequest request) {
        User user = securityUtils.getCurrentUser();
        Semester semester = semesterRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));

        if (request.getName() != null) semester.setName(request.getName());
        if (request.getSemesterType() != null) semester.setSemesterType(request.getSemesterType());
        if (request.getStartDate() != null) semester.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) semester.setEndDate(request.getEndDate());
        if (request.getAcademicYear() != null) semester.setAcademicYear(request.getAcademicYear());

        return semesterMapper.toResponse(semesterRepository.save(semester));
    }

    @Override
    @Transactional
    public SemesterResponse setActive(UUID id) {
        User user = securityUtils.getCurrentUser();

        // Deactivate current active
        semesterRepository.findByUserAndIsActiveTrue(user)
                .ifPresent(s -> { s.setIsActive(false); semesterRepository.save(s); });

        Semester semester = semesterRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        semester.setIsActive(true);

        return semesterMapper.toResponse(semesterRepository.save(semester));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Semester semester = semesterRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        semesterRepository.delete(semester);
    }
}
