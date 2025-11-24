## Running with Docker

This project includes a multi-stage Docker setup using Eclipse Temurin JDK 17. The application is built and run as a non-root user for improved security. The default exposed port is **8080** (Spring Boot default).

### Requirements
- Docker and Docker Compose installed
- No additional dependencies required on the host

### Environment Variables
- Example environment variables can be found in `src/main/resources/.env.example`.
- If you need to use environment variables, copy `.env.example` to `.env` and uncomment the `env_file` line in `docker-compose.yml`.

### Build and Run
To build and start the application:

```sh
docker compose up --build
```

This will:
- Build the application using Maven in a container
- Run the resulting JAR as a non-root user
- Expose port **8080** on your host

### Configuration
- The application runs on port **8080** by default. You can change the mapping in `docker-compose.yml` if needed.
- The container is named `java-app` and is attached to the `appnet` Docker network.
- No database or external services are configured by default. If you add any, update `docker-compose.yml` accordingly.

### Ports
- `8080:8080` – Application HTTP API

---

For more details on configuration, see the example environment file at `src/main/resources/.env.example` and the `application.properties` file.