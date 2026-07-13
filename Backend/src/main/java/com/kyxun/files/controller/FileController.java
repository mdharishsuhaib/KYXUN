package com.kyxun.files.controller;

import com.kyxun.common.constants.AppConstants;
import com.kyxun.common.pagination.PagedResponse;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.files.dto.response.FileRecordResponse;
import com.kyxun.files.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FileRecordResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subjectId", required = false) UUID subjectId,
            @RequestParam(value = "description", required = false) String description) {
        return ApiResponseBuilder.success("File uploaded successfully",
                fileService.upload(file, subjectId, description));
    }

    @GetMapping
    public ApiResponse<PagedResponse<FileRecordResponse>> getAll(
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Files fetched successfully", fileService.getAll(page, size));
    }

    @GetMapping("/subject/{subjectId}")
    public ApiResponse<PagedResponse<FileRecordResponse>> getBySubject(
            @PathVariable UUID subjectId,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponseBuilder.success("Files fetched successfully",
                fileService.getBySubject(subjectId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<FileRecordResponse> get(@PathVariable UUID id) {
        return ApiResponseBuilder.success("File fetched successfully", fileService.get(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        fileService.delete(id);
        return ApiResponseBuilder.success("File deleted successfully");
    }
}
