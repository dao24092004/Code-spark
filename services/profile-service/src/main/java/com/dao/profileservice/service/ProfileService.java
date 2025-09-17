package com.dao.profileservice.service;

import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.entity.Profile;

public interface ProfileService {

    Profile createProfile(ProfileDto profileDto);

    Profile getProfileByUserId(Long userId);

    Profile updateProfile(Long userId, ProfileDto profileDto);

    void deleteProfile(Long userId);
}
