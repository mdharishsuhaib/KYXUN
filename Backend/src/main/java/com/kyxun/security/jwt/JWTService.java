package com.kyxun.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Service
public class JWTService {

    @Value("${supabase.url:https://lrblyafjpomxjzzbvdoy.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.anon.key:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmx5YWZqcG9teGp6emJ2ZG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTY4NTYsImV4cCI6MjA5ODU3Mjg1Nn0.E7OIXVf2BuwYNWQFPIb6CqVY_xrGE5Av4vtFwkfVbdQ}")
    private String supabaseAnonKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, String> tokenCache = new ConcurrentHashMap<>();

    public JWTService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(5000);    // 5 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    public String extractUsername(String token) {
        try {
            // Fast fail if expired
            String[] chunks = token.split("\\.");
            if (chunks.length < 2) return null;
            String payload = new String(Base64.getUrlDecoder().decode(chunks[1]));
            Map<String, Object> claims = objectMapper.readValue(payload, Map.class);
            
            if (claims.containsKey("exp")) {
                long exp = ((Number) claims.get("exp")).longValue();
                if (System.currentTimeMillis() / 1000 >= exp) {
                    tokenCache.remove(token);
                    return null; // expired
                }
            }

            if (tokenCache.containsKey(token)) {
                return tokenCache.get(token);
            }

            // Verify with Supabase API
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.set("apikey", supabaseAnonKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/user",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String email = (String) response.getBody().get("email");
                if (email != null) {
                    tokenCache.put(token, email);
                    return email;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to validate Supabase token: " + e.getMessage());
        }
        return null;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String email = extractUsername(token);
        return email != null && email.equals(userDetails.getUsername());
    }

    public String generateToken(UserDetails userDetails) {
        return "SUPABASE_MANAGED_TOKEN";
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return "SUPABASE_MANAGED_TOKEN";
    }
}