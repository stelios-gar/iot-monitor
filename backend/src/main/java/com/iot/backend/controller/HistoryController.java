package com.iot.backend.controller;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.service.DataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class HistoryController {

    private final DataService dataService;

    @GetMapping("/history")
    public List<EnergyReading> getHistory() {
        return dataService.getHistory();
    }
}