package com.kyxun.calendar.service.impl;

import com.kyxun.calendar.dto.request.CreateCalendarEventRequest;
import com.kyxun.calendar.dto.request.UpdateCalendarEventRequest;
import com.kyxun.calendar.dto.response.CalendarEventResponse;
import com.kyxun.calendar.entity.CalendarEvent;
import com.kyxun.calendar.mapper.CalendarEventMapper;
import com.kyxun.calendar.repository.CalendarEventRepository;
import com.kyxun.calendar.service.CalendarEventService;
import com.kyxun.common.enums.EventType;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.course.entity.Course;
import com.kyxun.course.repository.CourseRepository;
import com.kyxun.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalendarEventServiceImpl implements CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final CourseRepository courseRepository;
    private final CalendarEventMapper calendarEventMapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public CalendarEventResponse create(CreateCalendarEventRequest request) {
        User user = securityUtils.getCurrentUser();

        CalendarEvent.CalendarEventBuilder<?, ?> builder = CalendarEvent.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .eventType(request.getEventType() != null ? request.getEventType() : EventType.OTHER)
                .startDateTime(request.getStartDateTime())
                .endDateTime(request.getEndDateTime())
                .allDay(request.getAllDay() != null ? request.getAllDay() : false)
                .location(request.getLocation())
                .color(request.getColor());

        if (request.getCourseId() != null) {
            Course course = courseRepository.findByIdAndUser(request.getCourseId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            builder.course(course);
        }

        return calendarEventMapper.toResponse(calendarEventRepository.save(builder.build()));
    }

    @Override
    public List<CalendarEventResponse> getAll() {
        User user = securityUtils.getCurrentUser();
        return calendarEventRepository.findByUserOrderByStartDateTimeAsc(user).stream()
                .map(calendarEventMapper::toResponse).toList();
    }

    @Override
    public List<CalendarEventResponse> getByType(EventType eventType) {
        User user = securityUtils.getCurrentUser();
        return calendarEventRepository.findByUserAndEventType(user, eventType).stream()
                .map(calendarEventMapper::toResponse).toList();
    }

    @Override
    public List<CalendarEventResponse> getByDateRange(OffsetDateTime start, OffsetDateTime end) {
        User user = securityUtils.getCurrentUser();
        return calendarEventRepository.findByUserAndDateRange(user, start, end).stream()
                .map(calendarEventMapper::toResponse).toList();
    }

    @Override
    public CalendarEventResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        return calendarEventMapper.toResponse(
                calendarEventRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new ResourceNotFoundException("Calendar event not found")));
    }

    @Override
    @Transactional
    public CalendarEventResponse update(UUID id, UpdateCalendarEventRequest request) {
        User user = securityUtils.getCurrentUser();
        CalendarEvent event = calendarEventRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar event not found"));

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getEventType() != null) event.setEventType(request.getEventType());
        if (request.getStartDateTime() != null) event.setStartDateTime(request.getStartDateTime());
        if (request.getEndDateTime() != null) event.setEndDateTime(request.getEndDateTime());
        if (request.getAllDay() != null) event.setAllDay(request.getAllDay());
        if (request.getLocation() != null) event.setLocation(request.getLocation());
        if (request.getColor() != null) event.setColor(request.getColor());

        if (request.getCourseId() != null) {
            Course course = courseRepository.findByIdAndUser(request.getCourseId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            event.setCourse(course);
        }

        return calendarEventMapper.toResponse(calendarEventRepository.save(event));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        CalendarEvent event = calendarEventRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar event not found"));
        calendarEventRepository.delete(event);
    }
}
