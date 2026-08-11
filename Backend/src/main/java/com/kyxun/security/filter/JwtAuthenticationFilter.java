package com.kyxun.security.filter;

import com.kyxun.authentication.repository.UserRepository;
import com.kyxun.common.enums.Role;
import com.kyxun.entity.User;
import com.kyxun.security.jwt.JWTService;
import com.kyxun.security.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JWTService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        String requestPath = request.getServletPath();
        if (requestPath.startsWith("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = null;
            try {
                userDetails = userDetailsService.loadUserByUsername(userEmail);
            } catch (UsernameNotFoundException e) {
                // Synchronize on the interned string to prevent DB race conditions on parallel initial requests
                synchronized (userEmail.intern()) {
                    try {
                        // Check again in case another thread just created the user
                        userDetails = userDetailsService.loadUserByUsername(userEmail);
                    } catch (UsernameNotFoundException ex) {
                        // Auto-create user if they log in via Supabase but don't exist in Spring DB
                        User newUser = User.builder()
                                .email(userEmail)
                                .firstName("Supabase")
                                .lastName("User")
                                .password("") // password managed by Supabase
                                .authProvider("SUPABASE")
                                .role(Role.STUDENT)
                                .accountEnabled(true)
                                .emailVerified(true)
                                .build();
                        userRepository.save(newUser);
                        userDetails = newUser;
                    }
                }
            }

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}