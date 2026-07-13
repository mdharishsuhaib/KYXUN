package com.kyxun.notification.service;

import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.notification.dto.request.CreateNotificationRequest;
import com.kyxun.notification.dto.response.NotificationResponse;

import java.util.UUID;

public interface NotificationService {

    NotificationResponse create(CreateNotificationRequest request);

    PagedResponse<NotificationResponse> getAll(int page, int size);

    PagedResponse<NotificationResponse> getUnread(int page, int size);

    long getUnreadCount();

    NotificationResponse markAsRead(UUID id);

    int markAllAsRead();

    void delete(UUID id);
}
