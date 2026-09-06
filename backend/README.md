# IoT Monitor — Backend

Spring Boot REST API for the IoT Energy Monitor thesis project.
Receives energy readings from an RP2350 microcontroller via LTE,
stores them in PostgreSQL, and broadcasts them in real-time to the frontend via WebSocket (STOMP).

## Stack

- Java 21
- Spring Boot 4.1.0
- Spring Data JPA + Hibernate
- Spring WebSocket (STOMP over SockJS)
- PostgreSQL 18
- Lombok
- Maven Wrapper (mvnw)

## Project Structure

```
src/main/java/com/iot/backend/
├── domain/
│   └── EnergyReading.java          # JPA entity → energy_readings table
├── repository/
│   └── EnergyReadingRepository.java # Spring Data JPA repository
├── service/
│   ├── DataService.java            # In-memory queue + batch write every 500ms
│   └── WebSocketService.java       # Broadcasts readings to /topic/readings
├── controller/
│   ├── DataIngestionController.java # POST /api/data
│   └── HistoryController.java       # GET /api/data/history
├── websocket/
│   └── WebSocketConfig.java        # STOMP endpoint at /ws
└── BackendApplication.java
```

## Prerequisites

- Docker Desktop (for PostgreSQL)
- Java 21+

## Database Setup

Run the PostgreSQL container:

```bash
docker run --name iot-postgres \
  -e POSTGRES_DB=iot_monitor \
  -e POSTGRES_USER=iotuser \
  -e POSTGRES_PASSWORD=iotpass \
  -p 5432:5432 \
  -d postgres:latest
```

Start/stop manually via Docker Desktop or:

```bash
docker start iot-postgres
docker stop iot-postgres
```

The `energy_readings` table is created automatically on first run
via `spring.jpa.hibernate.ddl-auto=update`.

## Running the App

```bash
chmod +x run.sh   # first time only
./run.sh
```

The `run.sh` script wraps `./mvnw spring-boot:run`. Pass any valid
Maven goal as an argument:

```bash
./run.sh clean install
./run.sh test
```

Server starts on `http://localhost:8080`.

## API Endpoints

### POST /api/data
Ingest a new energy reading (called by the RP2350).

```json
{
  "timestamp": "2026-06-22T10:00:00Z",
  "voltage": 3.78,
  "current": 125.4,
  "power": 474.0,
  "payloadSize": 512
}
```

Returns `200 OK`.

### GET /api/data/history
Returns all stored readings as a JSON array.

## WebSocket

Connect to `ws://localhost:8080/ws` using STOMP/SockJS and
subscribe to `/topic/readings` to receive real-time batches
every 500ms.

## How Batch Writing Works

1. Each incoming POST adds the reading to an in-memory `ConcurrentLinkedQueue`
2. A `@Scheduled` task runs every 500ms, drains the queue, and calls `repository.saveAll(batch)`
3. After the DB write, the batch is broadcast via WebSocket to all subscribed Angular clients
