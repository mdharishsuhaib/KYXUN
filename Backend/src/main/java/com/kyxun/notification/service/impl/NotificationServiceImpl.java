package com.kyxun.notification.service.impl;

import com.kyxun.authentication.repository.UserRepository;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.User;
import com.kyxun.notification.dto.request.CreateNotificationRequest;
import com.kyxun.notification.dto.response.NotificationResponse;
import com.kyxun.notification.entity.Notification;
import com.kyxun.notification.mapper.NotificationMapper;
import com.kyxun.notification.repository.NotificationRepository;
import com.kyxun.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public NotificationResponse create(CreateNotificationRequest request) {
        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = Notification.builder()
                .user(targetUser)
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType())
                .referenceId(request.getReferenceId())
                .isRead(false)
                .build();

        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    public PagedResponse<NotificationResponse> getAll(int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notificationPage = notificationRepository.findByUser(user, pageable);
        return buildPagedResponse(notificationPage);
    }

    @Override
    public PagedResponse<NotificationResponse> getUnread(int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notificationPage = notificationRepository.findByUserAndIsRead(user, false, pageable);
        return buildPagedResponse(notificationPage);
    }

    @Override
    public long getUnreadCount() {
        User user = securityUtils.getCurrentUser();
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID id) {
        User user = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setIsRead(true);
        notification.setReadAt(OffsetDateTime.now());
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public int markAllAsRead() {
        User user = securityUtils.getCurrentUser();
        return notificationRepository.markAllAsRead(user, OffsetDateTime.now());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notificationRepository.delete(notification);
    }

    private PagedResponse<NotificationResponse> buildPagedResponse(Page<Notification> page) {
        return PagedResponse.<NotificationResponse>builder()
                .content(page.getContent().stream().map(notificationMapper::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
