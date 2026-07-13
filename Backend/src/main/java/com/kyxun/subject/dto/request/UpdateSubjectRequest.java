package com.kyxun.subject.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSubjectRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    private String description;

}