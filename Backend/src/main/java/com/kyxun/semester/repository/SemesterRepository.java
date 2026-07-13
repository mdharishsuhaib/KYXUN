package com.kyxun.semester.repository;

import com.kyxun.entity.User;
import com.kyxun.semester.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SemesterRepository extends JpaRepository<Semester, UUID> {

    List<Semester> findByUser(User user);

    Optional<Semester> findByIdAndUser(UUID id, User user);

    Optional<Semester> findByUserAndIsActiveTrue(User user);

    boolean existsByUserAndName(User user, String name);
}
