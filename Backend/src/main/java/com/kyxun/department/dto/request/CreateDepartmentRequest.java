package com.kyxun.department.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateDepartmentRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 20)
    private String code;

    private String description;
}
