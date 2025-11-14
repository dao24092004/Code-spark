package com.dao.identity_service.security.oauth2;

import com.dao.identity_service.entity.User;
import com.dao.identity_service.security.JwtService;
import com.dao.identity_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;

    @Value("${app.oauth2.frontend-redirect-uri}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser(); // Assuming UserPrincipal has a method to get the User entity

        String accessToken = jwtService.generateTokenWithUserId(user, String.valueOf(user.getId()));

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("token", accessToken)
                .build().toUriString();
        
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
