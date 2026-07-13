package com.kyxun.examination.repository;

import com.kyxun.entity.User;
import com.kyxun.examination.entity.Examination;
import com.kyxun.semester.entity.Semester;
import com.kyxun.subject.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExaminationRepository extends JpaRepository<Examination, UUID> {

    Page<Examination> findByUser(User user, Pageable pageable);

    Page<Examination> findByUserAndSemester(User user, Semester semester, Pageable pageable);

    Page<Examination> findByUserAndSubject(User user, Subject subject, Pageable pageable);

    Page<Examination> findByUserAndExamType(User user, Examination.ExamType examType, Pageable pageable);

    Optional<Examination> findByIdAndUser(UUID id, User user);

    @Query("SELECT e FROM Examination e WHERE e.user = :user AND e.examDate >= :fromDate ORDER BY e.examDate ASC")
    List<Examination> findUpcoming(@Param("user") User user, @Param("fromDate") LocalDate fromDate);
}
