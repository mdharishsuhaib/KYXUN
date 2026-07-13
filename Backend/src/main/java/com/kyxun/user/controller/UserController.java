package com.kyxun.user.controller;

import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import com.kyxun.user.dto.request.ChangePasswordRequest;
import com.kyxun.user.dto.request.UpdateProfileRequest;
import com.kyxun.user.dto.response.UserProfileResponse;
import com.kyxun.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getProfile() {
        return ApiResponseBuilder.success("Profile fetched successfully", userService.getProfile());
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponseBuilder.success("Profile updated successfully", userService.updateProfile(request));
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponseBuilder.success("Password changed successfully");
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteAccount() {
        userService.deleteAccount();
        return ApiResponseBuilder.success("Account deleted successfully");
    }
}
