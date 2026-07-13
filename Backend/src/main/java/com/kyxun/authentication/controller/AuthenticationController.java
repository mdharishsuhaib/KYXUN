package com.kyxun.authentication.controller;

import com.kyxun.authentication.dto.request.ForgotPasswordRequest;
import com.kyxun.authentication.dto.request.LoginRequest;
import com.kyxun.authentication.dto.request.RefreshTokenRequest;
import com.kyxun.authentication.dto.request.RegisterRequest;
import com.kyxun.authentication.dto.request.ResetPasswordRequest;
import com.kyxun.authentication.dto.response.AuthenticationResponse;
import com.kyxun.authentication.service.AuthenticationService;
import com.kyxun.common.response.ApiResponse;
import com.kyxun.common.response.ApiResponseBuilder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthenticationResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ApiResponseBuilder.success("Registration successful",
                authenticationService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthenticationResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ApiResponseBuilder.success("Login successful",
                authenticationService.login(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponseBuilder.success("Token refreshed successfully",
                authenticationService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        authenticationService.logout();
        return ApiResponseBuilder.success("Logged out successfully");
    }

    /**
     * Initiates the forgot-password flow.
     * Always returns 200 OK regardless of whether the email exists,
     * to prevent email enumeration attacks.
     */
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authenticationService.forgotPassword(request);
        return ApiResponseBuilder.success(
                "If an account with this email exists, a password reset link has been sent");
    }

    /**
     * Completes the password reset flow using the secure token emailed to the user.
     */
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request);
        return ApiResponseBuilder.success(
                "Password reset successfully. Please log in with your new password");
    }
}