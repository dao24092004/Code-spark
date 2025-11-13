package com.dao.user_service.exception;

public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s already exists with %s '%s'", resourceName, fieldName, fieldValue));
    }
}
