package com.dao.profileservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

/**
 * FeignClient để gọi token-reward-service lấy số dư token.
 */
@FeignClient(name = "token-reward-service", url = "${app.services.token-reward-service.url:http://localhost:3000}")
public interface TokenRewardServiceClient {

    /**
     * Lấy số dư token của người dùng.
     *
     * @param studentId ID của người dùng
     * @return Số dư token
     */
    @GetMapping("/api/users/{studentId}/balance")
    TokenBalanceResponse getTokenBalance(@PathVariable("studentId") Long studentId);

    /**
     * Inner class cho response.
     */
    class TokenBalanceResponse {
        private boolean success;
        private BigDecimal balance;

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public BigDecimal getBalance() {
            return balance;
        }

        public void setBalance(BigDecimal balance) {
            this.balance = balance;
        }
    }
}
