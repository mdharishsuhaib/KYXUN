package com.kyxun.authentication.service.impl;

import com.kyxun.authentication.dto.request.ForgotPasswordRequest;
import com.kyxun.authentication.dto.request.LoginRequest;
import com.kyxun.authentication.dto.request.RefreshTokenRequest;
import com.kyxun.authentication.dto.request.RegisterRequest;
import com.kyxun.authentication.dto.request.ResetPasswordRequest;
import com.kyxun.authentication.dto.response.AuthenticationResponse;
import com.kyxun.authentication.entity.PasswordResetToken;
import com.kyxun.authentication.repository.PasswordResetTokenRepository;
import com.kyxun.authentication.repository.UserRepository;
import com.kyxun.authentication.service.AuthenticationService;
import com.kyxun.common.enums.Role;
import com.kyxun.common.exception.BadRequestException;
import com.kyxun.common.exception.ConflictException;
import com.kyxun.common.exception.ResourceNotFoundException;
import com.kyxun.common.exception.UnauthorizedException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.email.EmailService;
import com.kyxun.entity.User;
import com.kyxun.security.jwt.JWTService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;
    private final SecurityUtils securityUtils;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("An account with this email already exists");
        }

        String refreshToken = UUID.randomUUID().toString();

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .refreshToken(refreshToken)
                .accountEnabled(true)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }

    @Override
    @Transactional
    public AuthenticationResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtService.generateToken(user);

        // Rotate refresh token on every login
        String refreshToken = UUID.randomUUID().toString();
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }

    @org.springframework.beans.factory.annotation.Value("${google.clientId:}")
    private String googleClientId;

    @Override
    @Transactional
    public AuthenticationResponse googleLogin(com.kyxun.authentication.dto.request.GoogleLoginRequest request) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(request.getAccessToken());
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>("", headers);
            
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo", 
                org.springframework.http.HttpMethod.GET, 
                entity, 
                java.util.Map.class
            );

            java.util.Map<String, Object> payload = response.getBody();
            if (payload == null || !payload.containsKey("email")) {
                throw new UnauthorizedException("Invalid Google access token");
            }

            String email = (String) payload.get("email");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .firstName((String) payload.get("given_name"))
                        .lastName((String) payload.get("family_name"))
                        .email(email)
                        .authProvider("GOOGLE")
                        .profilePictureUrl((String) payload.get("picture"))
                        .role(Role.STUDENT)
                        .accountEnabled(true)
                        .emailVerified(true)
                        .build();
                return userRepository.save(newUser);
            });

            String accessToken = jwtService.generateToken(user);
            String refreshToken = UUID.randomUUID().toString();
            user.setRefreshToken(refreshToken);
            userRepository.save(user);

            return AuthenticationResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(86400L)
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .build();
        } catch (Exception e) {
            log.error("Google sign in failed", e);
            throw new UnauthorizedException("Google authentication failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {

        User user = userRepository.findByRefreshToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired refresh token"));

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = UUID.randomUUID().toString();

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return AuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }

    @Override
    @Transactional
    public void logout() {
        User user = securityUtils.getCurrentUser();
        user.setRefreshToken(null);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Always respond with success to prevent email enumeration
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            // Invalidate all previous tokens for this user
            passwordResetTokenRepository.deleteByUserId(user.getId());

            // Generate a cryptographically secure 48-byte token
            byte[] tokenBytes = new byte[48];
            new SecureRandom().nextBytes(tokenBytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(rawToken)
                    .expiresAt(OffsetDateTime.now().plusMinutes(30))
                    .used(false)
                    .build();

            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), rawToken);
            log.info("Password reset token issued for user: {}", user.getEmail());
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token"));

        if (resetToken.getUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }
        if (resetToken.isExpired()) {
            throw new BadRequestException("This reset link has expired. Please request a new one");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setRefreshToken(null); // Invalidate all active sessions
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password successfully reset for user: {}", user.getEmail());
    }
}