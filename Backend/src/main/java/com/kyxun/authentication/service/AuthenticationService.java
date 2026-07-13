package com.kyxun.authentication.service;

import com.kyxun.authentication.dto.request.ForgotPasswordRequest;
import com.kyxun.authentication.dto.request.LoginRequest;
import com.kyxun.authentication.dto.request.RefreshTokenRequest;
import com.kyxun.authentication.dto.request.RegisterRequest;
import com.kyxun.authentication.dto.request.ResetPasswordRequest;
import com.kyxun.authentication.dto.response.AuthenticationResponse;

public interface AuthenticationService {

    AuthenticationResponse register(RegisterRequest request);

    AuthenticationResponse login(LoginRequest request);

    AuthenticationResponse refreshToken(RefreshTokenRequest request);

    void logout();

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}