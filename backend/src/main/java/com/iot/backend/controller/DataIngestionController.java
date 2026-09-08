package com.iot.backend.controller;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.service.DataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives the RP2350 hub's energy measurement for one transmission.
 *
 * This is the second half of the hub's per-transmission workflow: it
 * first POSTs the actual payload to {@link StreamController}, measures
 * the voltage/current that transmission cost, then reports that
 * measurement here as an {@link EnergyReading}. Invalid payloads are
 * rejected with a 400 and a field-by-field explanation — see
 * {@link com.iot.backend.exception.GlobalExceptionHandler}.
 */
@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataIngestionController {

    private final DataService dataService;

    @PostMapping
    public ResponseEntity<Void> ingest(@Valid @RequestBody EnergyReading reading) {
        dataService.addReading(reading);
        return ResponseEntity.ok().build();
    }
}