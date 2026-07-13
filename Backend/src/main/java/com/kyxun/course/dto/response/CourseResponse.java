package com.kyxun.course.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CourseResponse {

    private UUID id;
    private String name;
    private String instructor;
    private String courseCode;
    private Integer credits;
    private String scheduleInfo;
    private String color;
    private String description;
    private UUID semesterId;
    private String semesterName;
    private UUID subjectId;
    private String subjectName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
