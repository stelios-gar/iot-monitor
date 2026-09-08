package com.iot.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "energy_readings")
public class EnergyReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "timestamp is required")
    @Column(nullable = false)
    private Instant timestamp;

    @NotNull(message = "voltage is required")
    @PositiveOrZero(message = "voltage must not be negative")
    @Column(nullable = false)
    private Double voltage;

    @NotNull(message = "current is required")
    @PositiveOrZero(message = "current must not be negative")
    @Column(nullable = false)
    private Double current;

    @NotNull(message = "power is required")
    @PositiveOrZero(message = "power must not be negative")
    @Column(nullable = false)
    private Double power;

    @NotNull(message = "payloadSize is required")
    @PositiveOrZero(message = "payloadSize must not be negative")
    @Column(nullable = false)
    private Integer payloadSize;
}
