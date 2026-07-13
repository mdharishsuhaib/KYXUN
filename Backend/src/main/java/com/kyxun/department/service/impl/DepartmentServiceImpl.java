package com.kyxun.department.service.impl;

import com.kyxun.common.exception.ConflictException;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.department.dto.request.CreateDepartmentRequest;
import com.kyxun.department.dto.request.UpdateDepartmentRequest;
import com.kyxun.department.dto.response.DepartmentResponse;
import com.kyxun.department.entity.Department;
import com.kyxun.department.mapper.DepartmentMapper;
import com.kyxun.department.repository.DepartmentRepository;
import com.kyxun.department.service.DepartmentService;
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
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public DepartmentResponse create(CreateDepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new ConflictException("Department with this name already exists");
        }
        if (request.getCode() != null && departmentRepository.existsByCode(request.getCode())) {
            throw new ConflictException("Department with this code already exists");
        }

        Department department = Department.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .build();

        return departmentMapper.toResponse(departmentRepository.save(department));
    }

    @Override
    @Cacheable(value = "departments")
    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse).toList();
    }

    @Override
    public DepartmentResponse get(UUID id) {
        return departmentMapper.toResponse(
                departmentRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found")));
    }

    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public DepartmentResponse update(UUID id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        if (request.getName() != null && !request.getName().equals(department.getName())) {
            if (departmentRepository.existsByName(request.getName())) {
                throw new ConflictException("Department with this name already exists");
            }
            department.setName(request.getName());
        }

        if (request.getCode() != null && !request.getCode().equals(department.getCode())) {
            if (departmentRepository.existsByCode(request.getCode())) {
                throw new ConflictException("Department with this code already exists");
            }
            department.setCode(request.getCode());
        }

        if (request.getDescription() != null) {
            department.setDescription(request.getDescription());
        }

        return departmentMapper.toResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public void delete(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        departmentRepository.delete(department);
    }
}
