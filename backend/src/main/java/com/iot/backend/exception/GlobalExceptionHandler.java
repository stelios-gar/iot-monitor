package com.iot.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns exceptions that would otherwise surface as a raw 500 (or, for a
 * malformed request, Spring's bare default error page) into a small,
 * consistent JSON body — without leaking stack traces to the client.
 *
 * Applies to every {@code @RestController} in the app.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** A @Valid-annotated request body (e.g. POST /api/data) failed Bean Validation. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (var fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "One or more fields failed validation.",
                fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /** The request body wasn't valid JSON, or didn't match the expected shape at all. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex) {
        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Malformed Request",
                "The request body could not be parsed.");
        return ResponseEntity.badRequest().body(body);
    }

    /** Fallback for anything unanticipated — logged in full server-side, but never echoed to the client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        log.error("Unhandled exception while processing a request", ex);
        ApiError body = ApiError.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Something went wrong while processing the request.");
        return ResponseEntity.internalServerError().body(body);
    }
}
