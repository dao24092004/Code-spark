package com.dao.fileservice.security;

import com.dao.fileservice.client.IdentityAuthClient;
import com.dao.fileservice.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final IdentityAuthClient identity;

    public Map<String, Object> validateToken(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        ApiResponse<Map<String, Object>> res = identity.validateToken(bearerToken);
        if (res == null || !res.isSuccess() || res.getData() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
        return res.getData();
    }

    public void requirePermission(String bearerToken, String permission) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        ApiResponse<Boolean> res = identity.checkPermission(bearerToken, permission);
        if (res == null || !Boolean.TRUE.equals(res.getData())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing permission: " + permission);
        }
    }
}
