package com.kyxun.analytics.service;

import com.kyxun.analytics.dto.response.DashboardStatsResponse;
import com.kyxun.analytics.dto.response.TaskAnalyticsResponse;

public interface AnalyticsService {

    DashboardStatsResponse getDashboardStats();

    TaskAnalyticsResponse getTaskAnalytics();
}
