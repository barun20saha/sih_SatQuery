package com.satquery.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SatQuery API Gateway — Spring Boot entry point.
 *
 * <p>This service acts as a lightweight reverse proxy that:
 * <ul>
 *   <li>Receives all frontend requests on port 8080</li>
 *   <li>Forwards /api/v1/** and /api/** to the Python FastAPI backend on port 8000</li>
 *   <li>Applies CORS headers so the React frontend (port 5173) can communicate freely</li>
 * </ul>
 *
 * <p>No Spring Cloud Gateway dependency — uses a plain RestTemplate proxy controller
 * to keep the JAR small and startup fast.
 */
@SpringBootApplication
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
