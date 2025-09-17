package com.dao.profileservice.controller;

import com.dao.profileservice.dto.FileDto;
import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.dto.UserDto;
import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.service.ProfileService;
import com.dao.profileservice.service.impl.ProfileDataResponse;
import com.dao.profileservice.service.impl.ProfileServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ProfileServiceImpl profileServiceImpl;

    @PostMapping
    public ResponseEntity<Profile> createProfile(@RequestBody ProfileDto profileDto) {
        Profile profile = profileService.createProfile(profileDto);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Profile> getProfile(@PathVariable Long userId) {
        Profile profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<Profile> updateProfile(@PathVariable Long userId,
                                               @RequestBody ProfileDto profileDto) {
        Profile profile = profileService.updateProfile(userId, profileDto);
        return ResponseEntity.ok(profile);
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long userId) {
        profileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}/complete")
    public ResponseEntity<ProfileDataResponse> getCompleteProfileData(@PathVariable Long userId) {
        ProfileDataResponse response = profileServiceImpl.getCompleteProfileData(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/identity")
    public ResponseEntity<UserDto> getUserFromIdentityService(@PathVariable Long userId) {
        UserDto user = profileServiceImpl.getUserFromIdentityService(userId);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{userId}/files")
    public ResponseEntity<List<FileDto>> getUserFiles(@PathVariable Long userId) {
        List<FileDto> files = profileServiceImpl.getUserFiles(userId);
        return ResponseEntity.ok(files);
    }

    @PostMapping("/user/{userId}/request-file-processing")
    public ResponseEntity<Void> requestFileProcessing(@PathVariable Long userId,
                                                     @RequestParam String operation,
                                                     @RequestBody Object data) {
        profileServiceImpl.requestFileProcessing(userId, operation, data);
        return ResponseEntity.accepted().build();
    }
}