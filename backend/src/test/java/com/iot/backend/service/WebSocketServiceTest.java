package com.iot.backend.service;

import com.iot.backend.domain.EnergyReading;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WebSocketServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void broadcastsTheBatchToTheReadingsTopic() {
        WebSocketService service = new WebSocketService(messagingTemplate);
        EnergyReading reading = new EnergyReading();
        reading.setTimestamp(Instant.now());
        reading.setVoltage(3.9);
        reading.setCurrent(120.0);
        reading.setPower(468.0);
        reading.setPayloadSize(64);
        List<EnergyReading> batch = List.of(reading);

        service.broadcast(batch);

        verify(messagingTemplate).convertAndSend("/topic/readings", batch);
    }
}
