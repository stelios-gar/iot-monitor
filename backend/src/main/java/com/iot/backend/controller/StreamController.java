package com.iot.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class StreamController {

    @PostMapping(value = "/api/stream", consumes = "application/octet-stream")
    public ResponseEntity<Void> receiveStream(@RequestBody byte[] payload) {
        return ResponseEntity.ok().build();
    }
}