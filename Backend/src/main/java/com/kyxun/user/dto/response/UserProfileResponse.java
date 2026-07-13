package com.kyxun.user.dto.response;

import com.kyxun.common.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String profilePictureUrl;
    private Role role;
    private Boolean emailVerified;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
