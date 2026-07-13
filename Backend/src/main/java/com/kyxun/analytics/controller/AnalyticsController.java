package com.kyxun.analytics.controller;

import com.kyxun.analytics.dto.response.DashboardStatsResponse;
import com.kyxun.analytics.dto.response.TaskAnalyticsResponse;
import com.kyxun.analytics.service.AnalyticsService;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardStatsResponse> getDashboard() {
        return ApiResponseBuilder.success("Dashboard stats fetched", analyticsService.getDashboardStats());
    }

    @GetMapping("/tasks")
    public ApiResponse<TaskAnalyticsResponse> getTaskAnalytics() {
        return ApiResponseBuilder.success("Task analytics fetched", analyticsService.getTaskAnalytics());
    }
}
