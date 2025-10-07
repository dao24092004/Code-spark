package com.dao.profileservice.service.impl;

import com.dao.common.exception.AppException;
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
import org.springframework.http.HttpStatus;
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
        // Check if user exists first
        try {
            identityServiceClient.getUserById(profileDto.getUserId());
        } catch (FeignException.NotFound e) {
            throw new AppException("User not found with id: " + profileDto.getUserId(), HttpStatus.NOT_FOUND);
        }

        if (profileRepository.findByUserId(profileDto.getUserId()).isPresent()) {
            throw new AppException("Profile already exists for user: " + profileDto.getUserId(), HttpStatus.CONFLICT);
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
                .orElseThrow(() -> new AppException("Profile not found for user: " + userId, HttpStatus.NOT_FOUND));
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
            throw new AppException("Error fetching user data from identity service", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    public List<FileDto> getUserFiles(Long userId) {
        try {
            log.info("Fetching user files synchronously via OpenFeign for user: {}", userId);
            return fileServiceClient.getUserFiles(userId);
        } catch (FeignException e) {
            log.error("Failed to fetch user files from file service for user: {}, error: {}",
                     userId, e.getMessage());
            return List.of(); // Return empty list if files are not critical
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
        try {
            user = getUserFromIdentityService(userId);
        } catch (AppException e) {
            log.warn("Could not fetch user data for complete profile, proceeding without it. Reason: {}", e.getMessage());
        }

        List<FileDto> files = getUserFiles(userId);

        return ProfileDataResponse.builder()
                .profile(profile)
                .user(user)
                .files(files)
                .build();
    }
}