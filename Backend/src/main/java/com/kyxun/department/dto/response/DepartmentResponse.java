package com.kyxun.department.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class DepartmentResponse {

    private UUID id;
    private String name;
    private String code;
    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
