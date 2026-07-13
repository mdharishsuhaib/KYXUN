package com.kyxun.calendar.dto.response;

import com.kyxun.common.enums.EventType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CalendarEventResponse {

    private UUID id;
    private String title;
    private String description;
    private EventType eventType;
    private OffsetDateTime startDateTime;
    private OffsetDateTime endDateTime;
    private Boolean allDay;
    private String location;
    private UUID courseId;
    private String courseName;
    private String color;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
