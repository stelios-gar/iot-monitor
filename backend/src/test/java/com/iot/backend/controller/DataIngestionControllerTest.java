package com.iot.backend.controller;

import com.iot.backend.domain.EnergyReading;
import com.iot.backend.service.DataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DataIngestionController.class)
class DataIngestionControllerTest {

    // Request bodies are plain strings rather than built via an ObjectMapper
    // — keeps this test independent of exactly which Jackson types/packages
    // this Boot version wires up.
    private static final String VALID_READING_JSON =
            "{\"timestamp\":\"2026-09-08T10:00:00Z\",\"voltage\":3.9,\"current\":120.5,\"power\":469.95,\"payloadSize\":256}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DataService dataService;

    @Test
    void acceptsAValidReadingAndHandsItToTheDataService() throws Exception {
        mockMvc.perform(post("/api/data")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_READING_JSON))
                .andExpect(status().isOk());

        verify(dataService).addReading(any(EnergyReading.class));
    }

    @Test
    void rejectsAReadingMissingRequiredFieldsWithA400AndFieldErrors() throws Exception {
        String missingEverythingButTimestamp = "{\"timestamp\":\"2026-09-08T10:00:00Z\"}";

        mockMvc.perform(post("/api/data")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingEverythingButTimestamp))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.fieldErrors.voltage").exists())
                .andExpect(jsonPath("$.fieldErrors.current").exists())
                .andExpect(jsonPath("$.fieldErrors.power").exists())
                .andExpect(jsonPath("$.fieldErrors.payloadSize").exists());
    }

    @Test
    void rejectsANegativeVoltageWithA400() throws Exception {
        String negativeVoltage =
                "{\"timestamp\":\"2026-09-08T10:00:00Z\",\"voltage\":-1.0,\"current\":120.5,\"power\":469.95,\"payloadSize\":256}";

        mockMvc.perform(post("/api/data")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(negativeVoltage))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.voltage").exists());
    }

    @Test
    void rejectsMalformedJsonWithA400() throws Exception {
        mockMvc.perform(post("/api/data")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not valid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Malformed Request"));
    }
}
