package com.satquery.gateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;

/**
 * SatQuery Proxy Controller — forwards all /api/** and /api/v1/** requests
 * to the Python FastAPI backend transparently.
 *
 * <p>Handles:
 * <ul>
 *   <li>All HTTP methods (GET, POST, PUT, DELETE, OPTIONS)</li>
 *   <li>Multipart form-data (image uploads) — proxied as raw byte streams</li>
 *   <li>JSON payloads</li>
 *   <li>Query string parameters</li>
 *   <li>Structured error responses when the backend is unreachable</li>
 * </ul>
 */
@RestController
public class ProxyController {

    private static final Logger log = LoggerFactory.getLogger(ProxyController.class);

    private final RestTemplate restTemplate;

    @Value("${satquery.backend.url:http://localhost:8000}")
    private String backendUrl;

    public ProxyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Gateway health check — returns gateway status + backend reachability.
     */
    @GetMapping("/gateway/health")
    public ResponseEntity<Map<String, Object>> gatewayHealth() {
        boolean backendReachable = false;
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(backendUrl + "/api/health", String.class);
            backendReachable = resp.getStatusCode().is2xxSuccessful();
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
            "gateway", "UP",
            "gatewayPort", 8080,
            "backendUrl", backendUrl,
            "backendReachable", backendReachable
        ));
    }

    /**
     * Catch-all proxy: forwards /api/** → backend /api/**
     * Preserves path, query string, headers, and body exactly.
     */
    @RequestMapping("/api/**")
    public ResponseEntity<byte[]> proxyApiRequest(HttpServletRequest request)
            throws URISyntaxException, IOException {
        return doProxy(request);
    }

    // ----------------------------------------------------------------
    // Internal proxy logic
    // ----------------------------------------------------------------

    private ResponseEntity<byte[]> doProxy(HttpServletRequest request)
            throws URISyntaxException, IOException {

        String targetPath = request.getRequestURI();
        String queryString = request.getQueryString();
        String targetUrl = backendUrl + targetPath + (queryString != null ? "?" + queryString : "");

        log.info("[Gateway] {} {} → {}", request.getMethod(), request.getRequestURI(), targetUrl);

        // Build forwarded headers (exclude hop-by-hop headers)
        HttpHeaders headers = buildForwardedHeaders(request);

        // Read body from request input stream (works for JSON and multipart)
        byte[] requestBody;
        try {
            requestBody = StreamUtils.copyToByteArray(request.getInputStream());
        } catch (IOException e) {
            requestBody = new byte[0];
        }

        HttpEntity<byte[]> entity = new HttpEntity<>(requestBody.length > 0 ? requestBody : null, headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                new URI(targetUrl), method, entity, byte[].class
            );
            // Forward response headers back to the client
            HttpHeaders responseHeaders = new HttpHeaders();
            response.getHeaders().forEach((key, values) -> {
                if (!isHopByHopHeader(key)) {
                    responseHeaders.addAll(key, values);
                }
            });
            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());

        } catch (HttpStatusCodeException ex) {
            // Backend returned an error — proxy it as-is
            log.warn("[Gateway] Backend error {}: {}", ex.getStatusCode(), ex.getMessage());
            return ResponseEntity.status(ex.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ex.getResponseBodyAsByteArray());

        } catch (ResourceAccessException ex) {
            // Backend is unreachable
            log.error("[Gateway] Backend unreachable: {}", ex.getMessage());
            String errorJson = """
                {
                  "error": true,
                  "errorTitle": "Backend Unavailable",
                  "errorMessage": "The SatQuery Python backend is not reachable at %s. Start it with: python -m uvicorn backend.main:app --port 8000",
                  "suggestion": "Ensure the Python FastAPI backend is running on port 8000."
                }
                """.formatted(backendUrl);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorJson.getBytes());
        }
    }

    private HttpHeaders buildForwardedHeaders(HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames != null) {
            while (headerNames.hasMoreElements()) {
                String name = headerNames.nextElement();
                if (!isHopByHopHeader(name)) {
                    List<String> values = Collections.list(request.getHeaders(name));
                    headers.addAll(name, values);
                }
            }
        }
        headers.set("X-Forwarded-For", request.getRemoteAddr());
        headers.set("X-Gateway", "SatQuery-Spring-Gateway/1.0");
        return headers;
    }

    private boolean isHopByHopHeader(String name) {
        if (name == null) return false;
        return switch (name.toLowerCase()) {
            case "connection", "keep-alive", "proxy-authenticate",
                 "proxy-authorization", "te", "trailers",
                 "transfer-encoding", "upgrade" -> true;
            default -> false;
        };
    }
}
