package com.kyxun.course.service;

import com.kyxun.course.dto.request.CreateCourseRequest;
import com.kyxun.course.dto.request.UpdateCourseRequest;
import com.kyxun.course.dto.response.CourseResponse;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    CourseResponse create(CreateCourseRequest request);

    List<CourseResponse> getAll();

    List<CourseResponse> getBySemester(UUID semesterId);

    CourseResponse get(UUID id);

    CourseResponse update(UUID id, UpdateCourseRequest request);

    void delete(UUID id);
}
