package com.kyxun.files.repository;

import com.kyxun.entity.User;
import com.kyxun.files.entity.FileRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FileRecordRepository extends JpaRepository<FileRecord, UUID> {

    Page<FileRecord> findByUser(User user, Pageable pageable);

    Page<FileRecord> findByUserAndSubjectId(User user, UUID subjectId, Pageable pageable);

    Optional<FileRecord> findByIdAndUser(UUID id, User user);

    long countByUser(User user);
}
