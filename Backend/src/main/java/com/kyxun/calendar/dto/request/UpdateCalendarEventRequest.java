package com.kyxun.calendar.dto.request;

import com.kyxun.common.enums.EventType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class UpdateCalendarEventRequest {

    @Size(max = 255)
    private String title;

    private String description;

    private EventType eventType;

    private OffsetDateTime startDateTime;

    private OffsetDateTime endDateTime;

    private Boolean allDay;

    @Size(max = 255)
    private String location;

    private UUID courseId;

    @Size(max = 10)
    private String color;
}
