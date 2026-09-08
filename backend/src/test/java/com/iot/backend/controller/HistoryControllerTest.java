package com.iot.backend.controller;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.service.DataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HistoryController.class)
class HistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DataService dataService;

    @Test
    void returnsEveryStoredReading() throws Exception {
        EnergyReading reading = new EnergyReading();
        reading.setId(1L);
        reading.setTimestamp(Instant.parse("2026-09-08T10:00:00Z"));
        reading.setVoltage(3.9);
        reading.setCurrent(120.0);
        reading.setPower(468.0);
        reading.setPayloadSize(128);
        when(dataService.getHistory()).thenReturn(List.of(reading));

        mockMvc.perform(get("/api/data/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].voltage").value(3.9))
                .andExpect(jsonPath("$[0].payloadSize").value(128));
    }

    @Test
    void returnsAnEmptyArrayWhenNoReadingsAreStoredYet() throws Exception {
        when(dataService.getHistory()).thenReturn(List.of());

        mockMvc.perform(get("/api/data/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
