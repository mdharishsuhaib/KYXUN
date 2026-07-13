package com.kyxun.files.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class FileRecordResponse {

    private UUID id;
    private UUID subjectId;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private String storagePath;
    private String description;
    private Boolean isPublic;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
