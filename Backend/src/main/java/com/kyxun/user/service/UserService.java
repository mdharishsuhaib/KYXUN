package com.kyxun.user.service;

import com.kyxun.user.dto.request.ChangePasswordRequest;
import com.kyxun.user.dto.request.UpdateProfileRequest;
import com.kyxun.user.dto.response.UserProfileResponse;

public interface UserService {

    UserProfileResponse getProfile();

    UserProfileResponse updateProfile(UpdateProfileRequest request);

    void changePassword(ChangePasswordRequest request);

    void deleteAccount();
}
