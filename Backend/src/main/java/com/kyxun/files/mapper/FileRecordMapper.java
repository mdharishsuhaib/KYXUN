package com.kyxun.files.mapper;

import com.kyxun.files.dto.response.FileRecordResponse;
import com.kyxun.files.entity.FileRecord;
import org.springframework.stereotype.Component;

@Component
public class FileRecordMapper {

    public FileRecordResponse toResponse(FileRecord record) {
        return FileRecordResponse.builder()
                .id(record.getId())
                .subjectId(record.getSubjectId())
                .originalName(record.getOriginalName())
                .contentType(record.getContentType())
                .fileSize(record.getFileSize())
                .storagePath(record.getStoragePath())
                .description(record.getDescription())
                .isPublic(record.getIsPublic())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
