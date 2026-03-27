package com.dao.courseservice.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Filter sử dụng Bucket4j.
 * Giới hạn:
 * - 100 requests/phút cho mỗi IP (public endpoints)
 * - 500 requests/phút cho authenticated users
 */
@Component
public class RateLimitFilter implements Filter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Cấu hình rate limit
    private static final int PUBLIC_REQUESTS_PER_MINUTE = 100;
    private static final int AUTHENTICATED_REQUESTS_PER_MINUTE = 500;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String clientIP = getClientIP(httpRequest);
        String bucketKey = clientIP;

        // Kiểm tra nếu là authenticated request
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // Thêm prefix cho authenticated requests
            bucketKey = "auth:" + clientIP;
        }

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(k.startsWith("auth:")));

        if (bucket.tryConsume(1)) {
            // Thêm rate limit headers
            httpResponse.setHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            chain.doFilter(request, response);
        } else {
            httpResponse.setStatus(429); // Too Many Requests
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
        }
    }

    private Bucket createBucket(boolean authenticated) {
        int requestsPerMinute = authenticated ? AUTHENTICATED_REQUESTS_PER_MINUTE : PUBLIC_REQUESTS_PER_MINUTE;

        Bandwidth limit = Bandwidth.classic(requestsPerMinute,
                Refill.greedy(requestsPerMinute, Duration.ofMinutes(1)));

        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
