package com.kyxun.calendar.repository;

import com.kyxun.calendar.entity.CalendarEvent;
import com.kyxun.common.enums.EventType;
import com.kyxun.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    List<CalendarEvent> findByUserOrderByStartDateTimeAsc(User user);

    List<CalendarEvent> findByUserAndEventType(User user, EventType eventType);

    Optional<CalendarEvent> findByIdAndUser(UUID id, User user);

    @Query("SELECT e FROM CalendarEvent e WHERE e.user = :user " +
            "AND e.startDateTime >= :start AND e.startDateTime <= :end " +
            "ORDER BY e.startDateTime ASC")
    List<CalendarEvent> findByUserAndDateRange(
            @Param("user") User user,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end);
}
