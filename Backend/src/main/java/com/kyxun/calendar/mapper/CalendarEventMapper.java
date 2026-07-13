package com.kyxun.calendar.mapper;

import com.kyxun.calendar.dto.response.CalendarEventResponse;
import com.kyxun.calendar.entity.CalendarEvent;
import org.springframework.stereotype.Component;

@Component
public class CalendarEventMapper {

    public CalendarEventResponse toResponse(CalendarEvent event) {
        return CalendarEventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType())
                .startDateTime(event.getStartDateTime())
                .endDateTime(event.getEndDateTime())
                .allDay(event.getAllDay())
                .location(event.getLocation())
                .courseId(event.getCourse() != null ? event.getCourse().getId() : null)
                .courseName(event.getCourse() != null ? event.getCourse().getName() : null)
                .color(event.getColor())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
