package com.iot.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives the raw LTE payload the RP2350 hub actually transmits.
 *
 * This endpoint deliberately does nothing with the payload beyond
 * accepting it — its purpose is to BE the network operation whose energy
 * cost is measured. The hub's per-transmission workflow is:
 *   1. POST the payload here.
 *   2. Measure the voltage/current draw that transmission cost.
 *   3. Report that measurement separately, as an EnergyReading, via
 *      {@link DataIngestionController#ingest}.
 *
 * Storing or forwarding the payload itself to the frontend is out of
 * scope for now and may be added later.
 */
@RestController
@RequiredArgsConstructor
public class StreamController {

    @PostMapping(value = "/api/stream", consumes = "application/octet-stream")
    public ResponseEntity<Void> receiveStream(@RequestBody byte[] payload) {
        return ResponseEntity.ok().build();
    }
}
