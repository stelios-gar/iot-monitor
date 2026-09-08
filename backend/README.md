# IoT Monitor — Backend

Spring Boot REST + WebSocket API for the IoT Energy Monitor thesis project.
Receives energy readings from an RP2350 microcontroller over LTE, stores
them in PostgreSQL, and broadcasts them in real time to the frontend over
WebSocket (STOMP). See `../frontend/README.md` for the Angular client.

## Stack

- Java 21
- Spring Boot 4.1.0
- Spring Data JPA + Hibernate
- Spring WebSocket (STOMP over SockJS)
- Bean Validation (Jakarta Validation)
- PostgreSQL 18 (H2 in-memory for tests — see [Running Tests](#running-tests))
- Lombok
- Maven Wrapper (`mvnw`)

## Project Structure

```
src/main/java/com/iot/backend/
├── domain/
│   └── EnergyReading.java           # JPA entity + Bean Validation constraints
├── repository/
│   └── EnergyReadingRepository.java # Spring Data JPA repository
├── service/
│   ├── DataService.java             # In-memory queue + batch write every 500ms
│   └── WebSocketService.java        # Broadcasts readings to /topic/readings
├── controller/
│   ├── StreamController.java        # POST /api/stream  — the measured payload itself
│   ├── DataIngestionController.java # POST /api/data    — the resulting energy measurement
│   └── HistoryController.java       # GET  /api/data/history
├── config/
│   └── WebConfig.java               # CORS for the REST API
├── websocket/
│   └── WebSocketConfig.java         # STOMP endpoint at /ws + its CORS
├── exception/
│   ├── ApiError.java                # Uniform JSON error body
│   └── GlobalExceptionHandler.java  # Maps exceptions -> ApiError responses
└── BackendApplication.java

src/test/java/com/iot/backend/
├── controller/   # @WebMvcTest slices — request/response/validation behavior
├── service/      # Plain Mockito unit tests — queue/batch/broadcast logic
├── repository/   # @DataJpaTest — against in-memory H2, not Postgres
└── BackendApplicationTests.java  # Full context load
```

## The Two-Call Flow (why there are two POST endpoints)

The RP2350 hub's per-transmission workflow is:

1. **`POST /api/stream`** — the hub sends the actual payload it's
   transmitting over LTE. This endpoint intentionally does nothing with the
   bytes beyond accepting them; its purpose is to *be* the network
   operation whose energy cost is being measured. Storing/forwarding that
   payload to the frontend is out of scope for now.
2. The hub measures the voltage/current draw that transmission cost.
3. **`POST /api/data`** — the hub reports that measurement separately, as
   an `EnergyReading`. This is the call that actually gets stored and
   broadcast to the frontend.

## Prerequisites

- Java 21+
- Docker Desktop (for PostgreSQL — only needed to run the app; **not**
  needed to run the tests, see [Running Tests](#running-tests))

## Configuration

Nothing is hardcoded — every setting below reads from an environment
variable, falling back to a default that matches `docker-compose.yml`. A
fresh clone runs with zero configuration; override any of these for a
different environment.

| Environment variable  | Default                                       | Used for                                   |
|------------------------|------------------------------------------------|---------------------------------------------|
| `DB_URL`                | `jdbc:postgresql://localhost:5432/iot_monitor` | JDBC connection string                       |
| `DB_USERNAME`            | `iotuser`                                      | Database user                                |
| `DB_PASSWORD`            | `iotpass`                                      | Database password                            |
| `SERVER_PORT`            | `8080`                                         | HTTP/WebSocket port                          |
| `CORS_ALLOWED_ORIGIN`     | `http://localhost:4200`                        | Origin allowed to call the API / open the WS |

`docker-compose.yml` also reads `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` to
configure the Postgres container itself (same names/defaults as above, plus
`DB_NAME` defaulting to `iot_monitor`) — set them once, in one place (a
`.env` file next to `docker-compose.yml`, or exported in your shell), and
both the container and the app pick them up consistently.

## Database Setup

```bash
docker compose up -d
```

This starts a Postgres 18 container pre-configured with the same
credentials the app defaults to, with its data persisted in a named Docker
volume (`iot-postgres-data`) so it survives `docker compose down`/restarts.
The `energy_readings` table itself is created automatically on first run
via `spring.jpa.hibernate.ddl-auto=update` — no manual schema/migration
step needed.

```bash
docker compose stop      # stop the container, keep its data
docker compose down      # stop and remove the container, keep its data (named volume)
docker compose down -v   # also delete the stored data
```

## Running the App

```bash
chmod +x run.sh   # first time only
./run.sh
```

`run.sh` wraps `./mvnw spring-boot:run`. Pass any valid Maven goal as an
argument:

```bash
./run.sh clean install
./run.sh test
```

Server starts on `http://localhost:8080` (or `$SERVER_PORT`).

## API Endpoints

### POST /api/stream
Accepts the raw LTE payload as `application/octet-stream`. See
[The Two-Call Flow](#the-two-call-flow-why-there-are-two-post-endpoints)
above. Always returns `200 OK`.

### POST /api/data
Ingest a new energy measurement (called by the RP2350, after the transmission above).

```json
{
  "timestamp": "2026-06-22T10:00:00Z",
  "voltage": 3.78,
  "current": 125.4,
  "power": 474.0,
  "payloadSize": 512
}
```

Returns `200 OK`, or `400 Bad Request` if a field is missing or negative:

```json
{
  "timestamp": "2026-09-08T12:00:00Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields failed validation.",
  "fieldErrors": { "voltage": "voltage must not be negative" }
}
```

### GET /api/data/history
Returns all stored readings as a JSON array.

## Error Handling

Every REST error response — validation failures, malformed JSON, or any
other unhandled exception — comes back as the same `ApiError` JSON shape
(`timestamp`, `status`, `error`, `message`, and `fieldErrors` when
applicable), via `GlobalExceptionHandler`. No stack trace or internal
detail is ever included in the response body; unexpected exceptions are
logged server-side and returned to the client as a generic `500`.

## WebSocket

Connect to `ws://localhost:8080/ws` using STOMP/SockJS and subscribe to
`/topic/readings` to receive real-time batches every 500ms. Same
`CORS_ALLOWED_ORIGIN` restriction as the REST API applies here too.

## How Batch Writing Works

1. Each incoming `POST /api/data` adds the reading to an in-memory `ConcurrentLinkedQueue`
2. A `@Scheduled` task runs every 500ms, drains the queue, and calls `repository.saveAll(batch)`
3. After the DB write, the batch is broadcast via WebSocket to all subscribed Angular clients

## Running Tests

```bash
./run.sh test
```

Tests run against an **in-memory H2 database**, not Postgres — configured
via `src/test/resources/application.properties`, which overrides the
datasource for the whole test run (including `BackendApplicationTests`'
full application-context load). This means `./run.sh test` needs no Docker
container running and no setup beyond cloning the repo.

- `controller/` — `@WebMvcTest` slices covering request handling, Bean
  Validation (missing/negative fields), and malformed-JSON handling.
- `service/` — plain Mockito unit tests for the queue → batch-write →
  broadcast pipeline in `DataService`, and the WebSocket broadcast itself.
- `repository/` — `@DataJpaTest` covering the JPA mapping against H2.
