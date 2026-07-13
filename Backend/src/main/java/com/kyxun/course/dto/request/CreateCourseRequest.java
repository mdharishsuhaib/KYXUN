package com.kyxun.course.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCourseRequest {

    @NotBlank(message = "Course name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String instructor;

    @Size(max = 30)
    private String courseCode;

    @Positive(message = "Credits must be positive")
    private Integer credits;

    private String scheduleInfo;

    @Size(max = 10)
    private String color;

    private String description;

    private UUID semesterId;

    private UUID subjectId;
}
