package com.kyxun.semester.service;

import com.kyxun.semester.dto.request.CreateSemesterRequest;
import com.kyxun.semester.dto.request.UpdateSemesterRequest;
import com.kyxun.semester.dto.response.SemesterResponse;

import java.util.List;
import java.util.UUID;

public interface SemesterService {

    SemesterResponse create(CreateSemesterRequest request);

    List<SemesterResponse> getAll();

    SemesterResponse get(UUID id);

    SemesterResponse update(UUID id, UpdateSemesterRequest request);

    SemesterResponse setActive(UUID id);

    void delete(UUID id);
}
