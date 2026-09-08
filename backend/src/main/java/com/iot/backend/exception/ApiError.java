package com.iot.backend.exception;

import java.time.Instant;
import java.util.Map;

/**
 * Uniform JSON error body for every error response the API returns, so a
 * client (or whoever's reading the response while debugging) always gets
 * the same shape back instead of a mix of Spring's default error page,
 * a raw stack trace, or an empty body.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors
) {

    public static ApiError of(int status, String error, String message) {
        return new ApiError(Instant.now(), status, error, message, null);
    }

    public static ApiError of(int status, String error, String message, Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status, error, message, fieldErrors);
    }
}
