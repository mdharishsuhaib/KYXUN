package com.kyxun.department.controller;

import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.department.dto.request.CreateDepartmentRequest;
import com.kyxun.department.dto.request.UpdateDepartmentRequest;
import com.kyxun.department.dto.response.DepartmentResponse;
import com.kyxun.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DepartmentResponse> create(@Valid @RequestBody CreateDepartmentRequest request) {
        return ApiResponseBuilder.success("Department created", departmentService.create(request));
    }

    @GetMapping
    public ApiResponse<List<DepartmentResponse>> getAll() {
        return ApiResponseBuilder.success("Departments fetched", departmentService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<DepartmentResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Department fetched", departmentService.get(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DepartmentResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDepartmentRequest request) {
        return ApiResponseBuilder.success("Department updated", departmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ApiResponseBuilder.success("Department deleted");
    }
}
