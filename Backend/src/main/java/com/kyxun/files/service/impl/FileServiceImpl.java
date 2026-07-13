package com.kyxun.files.service.impl;

import com.kyxun.common.exception.BadRequestException;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.entity.User;
import com.kyxun.files.dto.response.FileRecordResponse;
import com.kyxun.files.entity.FileRecord;
import com.kyxun.files.mapper.FileRecordMapper;
import com.kyxun.files.repository.FileRecordRepository;
import com.kyxun.files.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileServiceImpl implements FileService {

    private final FileRecordRepository fileRecordRepository;
    private final FileRecordMapper fileRecordMapper;
    private final SecurityUtils securityUtils;

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain"
    );

    @Override
    @Transactional
    public FileRecordResponse upload(MultipartFile file, UUID subjectId, String description) {
        User user = securityUtils.getCurrentUser();

        validateFile(file);

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        );
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx >= 0) {
            extension = originalFilename.substring(dotIdx);
        }
        String storedName = UUID.randomUUID() + extension;
        String userDir = uploadDir + "/" + user.getId();
        Path targetPath = Paths.get(userDir).resolve(storedName);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new BadRequestException("Failed to store file. Please try again.");
        }

        FileRecord record = FileRecord.builder()
                .user(user)
                .subjectId(subjectId)
                .originalName(originalFilename)
                .storedName(storedName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(targetPath.toString())
                .description(description)
                .isPublic(false)
                .build();

        return fileRecordMapper.toResponse(fileRecordRepository.save(record));
    }

    @Override
    public PagedResponse<FileRecordResponse> getAll(int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FileRecord> filePage = fileRecordRepository.findByUser(user, pageable);
        return buildPagedResponse(filePage);
    }

    @Override
    public PagedResponse<FileRecordResponse> getBySubject(UUID subjectId, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FileRecord> filePage = fileRecordRepository.findByUserAndSubjectId(user, subjectId, pageable);
        return buildPagedResponse(filePage);
    }

    @Override
    public FileRecordResponse get(UUID id) {
        User user = securityUtils.getCurrentUser();
        FileRecord record = fileRecordRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        return fileRecordMapper.toResponse(record);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = securityUtils.getCurrentUser();
        FileRecord record = fileRecordRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Attempt to delete the actual file from disk
        try {
            Path filePath = Paths.get(record.getStoragePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Could not delete physical file at {}: {}", record.getStoragePath(), e.getMessage());
        }

        fileRecordRepository.delete(record);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File size exceeds maximum allowed limit of 20MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("File type not allowed. Supported: PDF, images, Word, PowerPoint, plain text");
        }
    }

    private PagedResponse<FileRecordResponse> buildPagedResponse(Page<FileRecord> page) {
        return PagedResponse.<FileRecordResponse>builder()
                .content(page.getContent().stream().map(fileRecordMapper::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
