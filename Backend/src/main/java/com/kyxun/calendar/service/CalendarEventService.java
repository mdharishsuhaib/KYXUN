package com.kyxun.calendar.service;

import com.kyxun.calendar.dto.request.CreateCalendarEventRequest;
import com.kyxun.calendar.dto.request.UpdateCalendarEventRequest;
import com.kyxun.calendar.dto.response.CalendarEventResponse;
import com.kyxun.common.enums.EventType;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface CalendarEventService {

    CalendarEventResponse create(CreateCalendarEventRequest request);

    List<CalendarEventResponse> getAll();

    List<CalendarEventResponse> getByType(EventType eventType);

    List<CalendarEventResponse> getByDateRange(OffsetDateTime start, OffsetDateTime end);

    CalendarEventResponse get(UUID id);

    CalendarEventResponse update(UUID id, UpdateCalendarEventRequest request);

    void delete(UUID id);
}
