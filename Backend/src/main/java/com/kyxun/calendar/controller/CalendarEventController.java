package com.kyxun.calendar.controller;

import com.kyxun.calendar.dto.request.CreateCalendarEventRequest;
import com.kyxun.calendar.dto.request.UpdateCalendarEventRequest;
import com.kyxun.calendar.dto.response.CalendarEventResponse;
import com.kyxun.calendar.service.CalendarEventService;
import com.kyxun.common.enums.EventType;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CalendarEventResponse> create(@Valid @RequestBody CreateCalendarEventRequest request) {
        return ApiResponseBuilder.success("Event created successfully", calendarEventService.create(request));
    }

    @GetMapping
    public ApiResponse<List<CalendarEventResponse>> getAll() {
        return ApiResponseBuilder.success("Events fetched successfully", calendarEventService.getAll());
    }

    @GetMapping("/type/{eventType}")
    public ApiResponse<List<CalendarEventResponse>> getByType(@PathVariable EventType eventType) {
        return ApiResponseBuilder.success("Events fetched by type", calendarEventService.getByType(eventType));
    }

    @GetMapping("/range")
    public ApiResponse<List<CalendarEventResponse>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end) {
        return ApiResponseBuilder.success("Events fetched for date range",
                calendarEventService.getByDateRange(start, end));
    }

    @GetMapping("/{id}")
    public ApiResponse<CalendarEventResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("Event fetched successfully", calendarEventService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CalendarEventResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCalendarEventRequest request) {
        return ApiResponseBuilder.success("Event updated successfully", calendarEventService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        calendarEventService.delete(id);
        return ApiResponseBuilder.success("Event deleted successfully");
    }
}
