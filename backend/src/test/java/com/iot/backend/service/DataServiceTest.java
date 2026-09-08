package com.iot.backend.service;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.repository.EnergyReadingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Pure unit tests (no Spring context) for the queue → batch-write →
 * broadcast pipeline that ties the REST ingestion, the database, and the
 * WebSocket broadcast together.
 */
@ExtendWith(MockitoExtension.class)
class DataServiceTest {

    @Mock
    private EnergyReadingRepository repository;

    @Mock
    private WebSocketService webSocketService;

    private DataService dataService;

    @BeforeEach
    void setUp() {
        dataService = new DataService(repository, webSocketService);
    }

    @Test
    void flushQueueDoesNothingWhenNothingHasBeenQueued() {
        dataService.flushQueue();

        verifyNoInteractions(repository, webSocketService);
    }

    @Test
    void flushQueueSavesAndBroadcastsEveryQueuedReadingAsOneBatch() {
        EnergyReading first = reading(1.0);
        EnergyReading second = reading(2.0);
        dataService.addReading(first);
        dataService.addReading(second);

        dataService.flushQueue();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<EnergyReading>> savedCaptor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(savedCaptor.capture());
        assertThat(savedCaptor.getValue()).containsExactlyInAnyOrder(first, second);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<EnergyReading>> broadcastCaptor = ArgumentCaptor.forClass(List.class);
        verify(webSocketService).broadcast(broadcastCaptor.capture());
        assertThat(broadcastCaptor.getValue()).containsExactlyInAnyOrder(first, second);
    }

    @Test
    void flushQueueDrainsTheQueueSoTheSameReadingIsNeverFlushedTwice() {
        dataService.addReading(reading(1.0));

        dataService.flushQueue();
        dataService.flushQueue();

        verify(repository, org.mockito.Mockito.times(1)).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void getHistoryDelegatesToTheRepository() {
        EnergyReading stored = reading(3.0);
        when(repository.findAll()).thenReturn(List.of(stored));

        List<EnergyReading> history = dataService.getHistory();

        assertThat(history).containsExactly(stored);
    }

    private static EnergyReading reading(double voltage) {
        EnergyReading reading = new EnergyReading();
        reading.setTimestamp(Instant.now());
        reading.setVoltage(voltage);
        reading.setCurrent(100.0);
        reading.setPower(voltage * 100.0);
        reading.setPayloadSize(64);
        return reading;
    }
}
