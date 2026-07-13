package com.kyxun.authentication.service;

import com.kyxun.authentication.dto.request.LoginRequest;
import com.kyxun.authentication.dto.request.RegisterRequest;
import com.kyxun.authentication.dto.response.AuthenticationResponse;
import com.kyxun.authentication.repository.PasswordResetTokenRepository;
import com.kyxun.authentication.repository.UserRepository;
import com.kyxun.authentication.service.impl.AuthenticationServiceImpl;
import com.kyxun.common.enums.Role;
import com.kyxun.common.exception.ConflictException;
import com.kyxun.common.util.SecurityUtils;
import com.kyxun.email.EmailService;
import com.kyxun.entity.User;
import com.kyxun.security.jwt.JWTService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JWTService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private SecurityUtils securityUtils;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthenticationServiceImpl authService;

    private RegisterRequest registerRequest;
    private User savedUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("john@kyxun.com");
        registerRequest.setPassword("password123");

        savedUser = User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@kyxun.com")
                .password("encoded-pass")
                .role(Role.STUDENT)
                .accountEnabled(true)
                .emailVerified(false)
                .refreshToken("some-refresh-token")
                .build();
    }

    @Test
    void register_shouldSucceedForNewUser() {
        when(userRepository.existsByEmail("john@kyxun.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any())).thenReturn("jwt-access-token");

        AuthenticationResponse response = authService.register(registerRequest);

        assertThat(response.getAccessToken()).isEqualTo("jwt-access-token");
        assertThat(response.getEmail()).isEqualTo("john@kyxun.com");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_shouldThrowConflictForDuplicateEmail() {
        when(userRepository.existsByEmail("john@kyxun.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_shouldReturnTokensOnSuccess() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@kyxun.com");
        loginRequest.setPassword("password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userRepository.findByEmail("john@kyxun.com")).thenReturn(Optional.of(savedUser));
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(userRepository.save(any())).thenReturn(savedUser);

        AuthenticationResponse response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isNotBlank();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void login_shouldThrowBadCredentialsOnWrongPassword() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@kyxun.com");
        loginRequest.setPassword("wrong-password");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void logout_shouldClearRefreshToken() {
        when(securityUtils.getCurrentUser()).thenReturn(savedUser);
        when(userRepository.save(any())).thenReturn(savedUser);

        authService.logout();

        verify(userRepository).save(argThat(user -> user.getRefreshToken() == null));
    }
}
