package com.kyxun.course.controller;

import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.course.dto.request.CreateCourseRequest;
import com.kyxun.course.dto.request.UpdateCourseRequest;
import com.kyxun.course.dto.response.CourseResponse;
import com.kyxun.course.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CourseResponse> create(@Valid @RequestBody CreateCourseRequest request) {
        return ApiResponseBuilder.success("Course created successfully", courseService.create(request));
    }

    @GetMapping
    public ApiResponse<List<CourseResponse>> getAll() {
        return ApiResponseBuilder.success("Courses fetched successfully", courseService.getAll());
    }

    @GetMapping("/semester/{semesterId}")
    public ApiResponse<List<CourseResponse>> getBySemester(@PathVariable UUID semesterId) {
        return ApiResponseBuilder.success("Courses fetched by semester", courseService.getBySemester(semesterId));
    }

    @GetMapping("/{id}")
    public ApiResponse<CourseResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Course fetched successfully", courseService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CourseResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCourseRequest request) {
        return ApiResponseBuilder.success("Course updated successfully", courseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        courseService.delete(id);
        return ApiResponseBuilder.success("Course deleted successfully");
    }
}
