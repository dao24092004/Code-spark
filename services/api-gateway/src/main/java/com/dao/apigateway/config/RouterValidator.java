package com.dao.apigateway.config;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;

import java.util.List;
import java.util.function.Predicate;

@Component
public class RouterValidator {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    // Endpoints that should bypass authentication at the gateway
    public static final List<String> openApiEndpoints = List.of(
            // Auth endpoints
            "/identity/api/v1/auth/**",
            "/identity/api/v1/roles/**",
            "/api/v1/auth/**",

            // Service discovery
            "/eureka/**",

            // Swagger UI & resources
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/webjars/swagger-ui/**",

            // OpenAPI docs (both root and service-prefixed via the gateway)
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/**/v3/api-docs",
            "/**/v3/api-docs/**",

            // Actuator health (optional but common for k8s/docker health probes)
            "/actuator/health"
    );

    public Predicate<ServerHttpRequest> isSecured =
            request -> openApiEndpoints
                    .stream()
                    .noneMatch(pattern -> PATH_MATCHER.match(pattern, request.getURI().getPath()));

}
