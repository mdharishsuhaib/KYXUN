package com.kyxun.notification.controller;

import com.kyxun.common.constants.AppConstants;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.notification.dto.response.NotificationResponse;
import com.kyxun.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<PagedResponse<NotificationResponse>> getAll(
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Notifications fetched successfully",
                notificationService.getAll(page, size));
    }

    @GetMapping("/unread")
    public ApiResponse<PagedResponse<NotificationResponse>> getUnread(
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Unread notifications fetched successfully",
                notificationService.getUnread(page, size));
    }

    @GetMapping("/unread/count")
    public ApiResponse<Long> getUnreadCount() {
        return ApiResponseBuilder.success("Unread count fetched",
                notificationService.getUnreadCount());
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Notification marked as read",
                notificationService.markAsRead(id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Integer> markAllAsRead() {
        return ApiResponseBuilder.success("All notifications marked as read",
                notificationService.markAllAsRead());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        notificationService.delete(id);
        return ApiResponseBuilder.success("Notification deleted successfully");
    }
}
