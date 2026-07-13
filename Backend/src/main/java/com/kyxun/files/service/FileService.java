package com.kyxun.files.service;

import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.files.dto.response.FileRecordResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileService {

    FileRecordResponse upload(MultipartFile file, UUID subjectId, String description);

    PagedResponse<FileRecordResponse> getAll(int page, int size);

    PagedResponse<FileRecordResponse> getBySubject(UUID subjectId, int page, int size);

    FileRecordResponse get(UUID id);

    void delete(UUID id);
}
