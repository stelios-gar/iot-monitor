package com.iot.backend.repository;

import com.iot.backend.domain.EnergyReading;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * @DataJpaTest runs against an in-memory database (H2, on the test
 * classpath — see pom.xml) rather than the real Postgres instance, so this
 * needs no Docker container running.
 */
@DataJpaTest
class EnergyReadingRepositoryTest {

    @Autowired
    private EnergyReadingRepository repository;

    @Test
    void savesAReadingAndAssignsItAnId() {
        EnergyReading reading = new EnergyReading();
        reading.setTimestamp(Instant.parse("2026-09-08T10:00:00Z"));
        reading.setVoltage(3.9);
        reading.setCurrent(120.5);
        reading.setPower(469.95);
        reading.setPayloadSize(256);

        EnergyReading saved = repository.save(reading);

        assertThat(saved.getId()).isNotNull();
    }

    @Test
    void findAllReturnsEveryStoredReading() {
        repository.save(reading(3.9));
        repository.save(reading(4.0));

        List<EnergyReading> all = repository.findAll();

        assertThat(all).hasSize(2);
        assertThat(all).extracting(EnergyReading::getVoltage).containsExactlyInAnyOrder(3.9, 4.0);
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
