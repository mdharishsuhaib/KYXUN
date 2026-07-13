package com.kyxun.planner.repository;

import com.kyxun.entity.User;
import com.kyxun.planner.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    List<StudySession> findByUserOrderByPlannedDateAsc(User user);

    List<StudySession> findByUserAndPlannedDate(User user, LocalDate date);

    List<StudySession> findByUserAndPlannedDateBetween(User user, LocalDate start, LocalDate end);

    Optional<StudySession> findByIdAndUser(UUID id, User user);

    @Query("SELECT COALESCE(SUM(s.actualDurationMinutes), 0) FROM StudySession s " +
            "WHERE s.user = :user AND s.plannedDate BETWEEN :start AND :end AND s.status = 'COMPLETED'")
    Integer sumActualDurationByUserAndDateRange(
            @Param("user") User user,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
