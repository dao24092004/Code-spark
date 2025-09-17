package com.dao.profileservice.service.impl;

import com.dao.profileservice.dto.FileDto;
import com.dao.profileservice.dto.UserDto;
import com.dao.profileservice.entity.Profile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDataResponse {
    private Profile profile;
    private UserDto user;
    private List<FileDto> files;
}