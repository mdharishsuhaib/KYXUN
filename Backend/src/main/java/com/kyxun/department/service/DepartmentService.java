package com.kyxun.department.service;

import com.kyxun.department.dto.request.CreateDepartmentRequest;
import com.kyxun.department.dto.request.UpdateDepartmentRequest;
import com.kyxun.department.dto.response.DepartmentResponse;

import java.util.List;
import java.util.UUID;

public interface DepartmentService {

    DepartmentResponse create(CreateDepartmentRequest request);

    List<DepartmentResponse> getAll();

    DepartmentResponse get(UUID id);

    DepartmentResponse update(UUID id, UpdateDepartmentRequest request);

    void delete(UUID id);
}
