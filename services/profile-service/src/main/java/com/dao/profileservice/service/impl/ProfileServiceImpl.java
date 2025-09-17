package com.dao.profileservice.service.impl;

import com.dao.profileservice.client.FileServiceClient;
import com.dao.profileservice.client.IdentityServiceClient;
import com.dao.profileservice.dto.FileDto;
import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.dto.UserDto;
import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.messaging.ProfileEventProducer;
import com.dao.profileservice.repository.ProfileRepository;
import com.dao.profileservice.service.ProfileService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final IdentityServiceClient identityServiceClient;
    private final FileServiceClient fileServiceClient;
    private final ProfileEventProducer profileEventProducer;

    @Override
    public Profile createProfile(ProfileDto profileDto) {
        UserDto user = getUserFromIdentityService(profileDto.getUserId());

        if (user == null) {
            throw new RuntimeException("User not found with id: " + profileDto.getUserId());
        }

        Profile profile = Profile.builder()
                .userId(profileDto.getUserId())
                .firstName(profileDto.getFirstName())
                .lastName(profileDto.getLastName())
                .email(profileDto.getEmail())
                .bio(profileDto.getBio())
                .build();

        profile = profileRepository.save(profile);

        profileEventProducer.sendProfileCreatedEvent(profile.getUserId(), profile.getId());
        log.info("Created profile for user: {}", profile.getUserId());

        return profile;
    }

    @Override
    public Profile getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId));
    }

    @Override
    public Profile updateProfile(Long userId, ProfileDto profileDto) {
        Profile existingProfile = getProfileByUserId(userId);

        existingProfile.setFirstName(profileDto.getFirstName());
        existingProfile.setLastName(profileDto.getLastName());
        existingProfile.setEmail(profileDto.getEmail());
        existingProfile.setBio(profileDto.getBio());

        Profile updatedProfile = profileRepository.save(existingProfile);

        profileEventProducer.sendProfileUpdatedEvent(updatedProfile.getUserId(), updatedProfile.getId());
        log.info("Updated profile for user: {}", updatedProfile.getUserId());

        return updatedProfile;
    }

    @Override
    public void deleteProfile(Long userId) {
        Profile profile = getProfileByUserId(userId);
        profileRepository.delete(profile);
        log.info("Deleted profile for user: {}", userId);
    }

    public UserDto getUserFromIdentityService(Long userId) {
        try {
            log.info("Fetching user data synchronously via OpenFeign for user: {}", userId);
            return identityServiceClient.getUserById(userId);
        } catch (FeignException e) {
            log.error("Failed to fetch user data from identity service for user: {}, error: {}",
                     userId, e.getMessage());
            return null;
        }
    }

    public List<FileDto> getUserFiles(Long userId) {
        try {
            log.info("Fetching user files synchronously via OpenFeign for user: {}", userId);
            return fileServiceClient.getUserFiles(userId);
        } catch (FeignException e) {
            log.error("Failed to fetch user files from file service for user: {}, error: {}",
                     userId, e.getMessage());
            return List.of();
        }
    }

    public void requestFileProcessing(Long userId, String operation, Object data) {
        log.info("Sending asynchronous file processing request via Kafka for user: {}, operation: {}",
                userId, operation);
        profileEventProducer.sendUserFileProcessingRequest(userId, operation, data);
    }

    public ProfileDataResponse getCompleteProfileData(Long userId) {
        Profile profile = getProfileByUserId(userId);

        UserDto user = null;
        List<FileDto> files = List.of();

        try {
            user = getUserFromIdentityService(userId);
        } catch (Exception e) {
            log.warn("Could not fetch user data synchronously, using basic profile data only");
        }

        try {
            files = getUserFiles(userId);
        } catch (Exception e) {
            log.warn("Could not fetch user files, files list will be empty");
        }

        return ProfileDataResponse.builder()
                .profile(profile)
                .user(user)
                .files(files)
                .build();
    }
}