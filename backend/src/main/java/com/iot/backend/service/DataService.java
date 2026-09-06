package com.iot.backend.service;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.repository.EnergyReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@RequiredArgsConstructor
public class DataService {

    private final EnergyReadingRepository repository;
    private final WebSocketService webSocketService;

    private final ConcurrentLinkedQueue<EnergyReading> queue = new ConcurrentLinkedQueue<>();

    public void addReading(EnergyReading reading) {
        queue.add(reading);
    }

    @Scheduled(fixedDelay = 500)
    public void flushQueue() {
        if (queue.isEmpty()) return;

        List<EnergyReading> batch = new ArrayList<>();
        while (!queue.isEmpty()) {
            batch.add(queue.poll());
        }

        repository.saveAll(batch);
        webSocketService.broadcast(batch);
    }

    public List<EnergyReading> getHistory() {
        return repository.findAll();
    }
}