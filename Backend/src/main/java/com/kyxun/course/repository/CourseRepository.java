package com.kyxun.course.repository;

import com.kyxun.course.entity.Course;
import com.kyxun.entity.User;
import com.kyxun.semester.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByUser(User user);

    List<Course> findByUserAndSemester(User user, Semester semester);

    Optional<Course> findByIdAndUser(UUID id, User user);

    boolean existsByUserAndName(User user, String name);
}
