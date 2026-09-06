package com.iot.backend.service;

import com.iot.backend.domain.EnergyReading;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcast(List<EnergyReading> readings) {
        messagingTemplate.convertAndSend("/topic/readings", readings);
    }
}