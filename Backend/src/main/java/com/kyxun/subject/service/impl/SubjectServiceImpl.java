package com.kyxun.subject.service.impl;

import com.kyxun.common.exception.ConflictException;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.User;
import com.kyxun.subject.dto.request.CreateSubjectRequest;
import com.kyxun.subject.dto.request.UpdateSubjectRequest;
import com.kyxun.subject.dto.response.SubjectResponse;
import com.kyxun.subject.entity.Subject;
import com.kyxun.subject.mapper.SubjectMapper;
import com.kyxun.subject.repository.SubjectRepository;
import com.kyxun.subject.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final SubjectMapper subjectMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public SubjectResponse create(CreateSubjectRequest request) {
        User user = securityUtils.getCurrentUser();

        if (subjectRepository.existsByUserAndName(user, request.getName())) {
            throw new ConflictException("Subject already exists.");
        }

        Subject subject = Subject.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .build();

        return subjectMapper.toResponse(subjectRepository.save(subject));
    }

    @Override
    @Cacheable(value = "subjects", key = "#root.methodName + ':' + @securityUtils.currentUserEmail")
    public List<SubjectResponse> getAll() {
        User user = securityUtils.getCurrentUser();
        return subjectRepository.findByUser(user)
                .stream()
                .map(subjectMapper::toResponse)
                .toList();
    }

    @Override
    public SubjectResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        Subject subject = subjectRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        return subjectMapper.toResponse(subject);
    }

    @Override
    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public SubjectResponse update(UUID id, UpdateSubjectRequest request) {
        User user = securityUtils.getCurrentUser();
        Subject subject = subjectRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        subject.setName(request.getName());
        subject.setDescription(request.getDescription());

        return subjectMapper.toResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Subject subject = subjectRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        subjectRepository.delete(subject);
    }
}