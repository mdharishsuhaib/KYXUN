package com.kyxun.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.*;

class JWTServiceTest {

    private JWTService jwtService;

    // 512-bit base64 secret for HS512
    private static final String TEST_SECRET =
            "dGVzdFNlY3JldEtleUZvckp3dFNlcnZpY2VVbml0VGVzdHMxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=";

    @BeforeEach
    void setUp() {
        jwtService = new JWTService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);
    }

    private UserDetails buildUser(String email) {
        return User.builder()
                .username(email)
                .password("encoded-password")
                .authorities(Collections.emptyList())
                .build();
    }

    @Test
    void generateToken_shouldReturnNonBlankToken() {
        UserDetails user = buildUser("student@kyxun.com");
        String token = jwtService.generateToken(user);
        assertThat(token).isNotBlank();
    }

    @Test
    void extractUsername_shouldReturnCorrectEmail() {
        UserDetails user = buildUser("student@kyxun.com");
        String token = jwtService.generateToken(user);
        String extracted = jwtService.extractUsername(token);
        assertThat(extracted).isEqualTo("student@kyxun.com");
    }

    @Test
    void isTokenValid_shouldReturnTrueForValidToken() {
        UserDetails user = buildUser("test@kyxun.com");
        String token = jwtService.generateToken(user);
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    void isTokenValid_shouldReturnFalseForDifferentUser() {
        UserDetails user1 = buildUser("user1@kyxun.com");
        UserDetails user2 = buildUser("user2@kyxun.com");
        String token = jwtService.generateToken(user1);
        assertThat(jwtService.isTokenValid(token, user2)).isFalse();
    }

    @Test
    void generateToken_shouldExpireAfterConfiguredTime() {
        jwtService = new JWTService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
        // 1ms expiry — token should be immediately invalid
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 1L);
        UserDetails user = buildUser("expired@kyxun.com");
        String token = jwtService.generateToken(user);
        // Give it a moment to expire
        try { Thread.sleep(10); } catch (InterruptedException ignored) {}
        assertThat(jwtService.isTokenValid(token, user)).isFalse();
    }
}
