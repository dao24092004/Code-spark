package com.dao.identity_service.security.oauth2;

import com.dao.identity_service.entity.AuthProvider;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.repository.UserRepository;
import com.dao.identity_service.security.UserPrincipal;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;

    public CustomOidcUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        String email = oidcUser.getEmail();
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (user.getProvider() != AuthProvider.GOOGLE) {
                // Handle conflict: user exists with a different provider
                // For now, we can throw an exception or handle it as per business logic
                throw new OAuth2AuthenticationException("User already exists with provider " + user.getProvider());
            }
        } else {
            user = new User();
            user.setEmail(email);
            user.setUsername(email); // Set username to email
            user.setFirstName(oidcUser.getGivenName());
            user.setLastName(oidcUser.getFamilyName());
            user.setAvatarUrl(oidcUser.getPicture());
            user.setProvider(AuthProvider.GOOGLE);
            user.setEnabled(true); // Or handle email verification
            user = userRepository.save(user);
        }
        return new UserPrincipal(user, oidcUser.getAttributes(), oidcUser.getIdToken());
    }
}
