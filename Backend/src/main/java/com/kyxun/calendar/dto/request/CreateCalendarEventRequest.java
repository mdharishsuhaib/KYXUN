package com.kyxun.calendar.dto.request;

import com.kyxun.common.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class CreateCalendarEventRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    private String description;

    private EventType eventType = EventType.OTHER;

    @NotNull(message = "Start date/time is required")
    private OffsetDateTime startDateTime;

    private OffsetDateTime endDateTime;

    private Boolean allDay = false;

    @Size(max = 255)
    private String location;

    private UUID courseId;

    @Size(max = 10)
    private String color;
}
