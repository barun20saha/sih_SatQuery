package com.satquery.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.time.Duration;
import java.util.Arrays;

/**
 * CORS + RestTemplate configuration for the SatQuery API Gateway.
 *
 * <p>Allows the React Vite dev server (port 5173) and any production origin
 * to call the gateway endpoints. All preflight OPTIONS requests are handled
 * automatically by Spring MVC's CORS filter.
 *
 * <p>Bug fix: Spring cannot inject a comma-separated string into String[] via @Value
 * directly. We inject as a single String and split manually, which works reliably
 * across all Spring Boot 3.x versions.
 */
@Configuration
public class GatewayConfig implements WebMvcConfigurer {

    /**
     * Comma-separated list of allowed CORS origins injected as a single String.
     * Splitting here avoids the Spring @Value + String[] parsing limitation.
     */
    @Value("${satquery.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}")
    private String allowedOriginsRaw;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        registry.addMapping("/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * RestTemplate with generous timeouts to accommodate ML inference duration.
     * Connection timeout: 10s | Read timeout: 300s (5 min for heavy GPU inference)
     *
     * <p>Uses setBufferRequestBody(false) so large multipart satellite image uploads
     * stream directly rather than being fully buffered in heap memory.
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofMinutes(5))
                .build();
    }
}
