package com.iot.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StreamController.class)
class StreamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void acceptsARawByteStreamPayload() throws Exception {
        byte[] payload = "simulated LTE transmission payload".getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/stream")
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsATrulyEmptyBodyAsAMissingRequest() throws Exception {
        // Spring MVC treats a zero-length @RequestBody as a missing body by
        // default (HttpMessageNotReadableException, mapped to 400 by
        // GlobalExceptionHandler) — not something this endpoint opts out of,
        // and not a payload the RP2350 would realistically ever send.
        mockMvc.perform(post("/api/stream")
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .content(new byte[0]))
                .andExpect(status().isBadRequest());
    }
}
