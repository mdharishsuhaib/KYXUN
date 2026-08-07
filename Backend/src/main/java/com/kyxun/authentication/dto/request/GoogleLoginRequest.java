package com.kyxun.authentication.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Access Token is required")
    private String accessToken;
}
