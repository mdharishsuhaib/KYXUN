package com.kyxun.subject.service;

import com.kyxun.subject.dto.request.CreateSubjectRequest;
import com.kyxun.subject.dto.request.UpdateSubjectRequest;
import com.kyxun.subject.dto.response.SubjectResponse;

import java.util.List;
import java.util.UUID;

public interface SubjectService {

    SubjectResponse create(CreateSubjectRequest request);

    List<SubjectResponse> getAll();

    SubjectResponse get(UUID id);

    SubjectResponse update(UUID id, UpdateSubjectRequest request);

    void delete(UUID id);

}