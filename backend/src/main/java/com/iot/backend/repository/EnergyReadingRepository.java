package com.iot.backend.repository;

import com.iot.backend.domain.EnergyReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnergyReadingRepository extends JpaRepository<EnergyReading, Long> {
}
