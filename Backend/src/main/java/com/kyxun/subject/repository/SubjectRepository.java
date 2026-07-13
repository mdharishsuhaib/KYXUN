package com.kyxun.subject.repository;

import com.kyxun.entity.User;
import com.kyxun.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<Subject, UUID> {

    List<Subject> findByUser(User user);

    Optional<Subject> findByIdAndUser(UUID id, User user);

    boolean existsByUserAndName(User user,String name);

}