package com.iot.backend.controller;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.service.DataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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