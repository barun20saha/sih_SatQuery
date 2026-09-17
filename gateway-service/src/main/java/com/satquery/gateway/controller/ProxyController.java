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
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
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
 *   <li>Query string parameters (URL-encoded correctly)</li>
 *   <li>Structured error responses when the backend is unreachable</li>
 * </ul>
 *
 * <p>Bug fix: the original {@code new URI(targetUrl)} constructor throws
 * {@code URISyntaxException} when query strings contain spaces or special chars.
 * Now uses {@code UriComponentsBuilder} for correct RFC-3986 encoding.
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
        String backendStatus = "unreachable";
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(backendUrl + "/api/health", String.class);
            backendReachable = resp.getStatusCode().is2xxSuccessful();
            backendStatus = resp.getStatusCode().toString();
        } catch (Exception e) {
            backendStatus = e.getMessage() != null ? e.getMessage().substring(0, Math.min(80, e.getMessage().length())) : "error";
        }

        return ResponseEntity.ok(Map.of(
            "gateway",          "UP",
            "gatewayPort",      8080,
            "backendUrl",       backendUrl,
            "backendReachable", backendReachable,
            "backendStatus",    backendStatus
        ));
    }

    /**
     * Catch-all proxy: forwards /api/** → backend /api/**
     * Preserves path, query string, headers, and body exactly.
     */
    @RequestMapping("/api/**")
    public ResponseEntity<byte[]> proxyApiRequest(HttpServletRequest request)
            throws IOException {
        return doProxy(request);
    }

    // ----------------------------------------------------------------
    // Internal proxy logic
    // ----------------------------------------------------------------

    private ResponseEntity<byte[]> doProxy(HttpServletRequest request) throws IOException {

        String requestPath   = request.getRequestURI();
        String rawQuery      = request.getQueryString();

        // Use UriComponentsBuilder for RFC-3986-compliant URI construction.
        // This correctly handles special characters in query strings (spaces, +, etc.)
        // that would cause URISyntaxException with new URI(rawString).
        URI targetUri;
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromUriString(backendUrl)
                    .path(requestPath);
            if (rawQuery != null && !rawQuery.isEmpty()) {
                builder.query(rawQuery);
            }
            targetUri = builder.build(true).toUri();  // build(true) = already encoded
        } catch (Exception ex) {
            log.error("[Gateway] Failed to build target URI for path {}: {}", requestPath, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(("{\"error\":true,\"errorTitle\":\"Gateway URI Error\",\"errorMessage\":\"" + ex.getMessage() + "\"}").getBytes(StandardCharsets.UTF_8));
        }

        log.info("[Gateway] {} {} → {}", request.getMethod(), requestPath, targetUri);

        // Build forwarded headers (exclude hop-by-hop headers)
        HttpHeaders headers = buildForwardedHeaders(request);

        // Read body from request input stream (works for JSON and multipart)
        byte[] requestBody;
        try {
            requestBody = StreamUtils.copyToByteArray(request.getInputStream());
        } catch (IOException e) {
            log.warn("[Gateway] Failed to read request body: {}", e.getMessage());
            requestBody = new byte[0];
        }

        HttpEntity<byte[]> entity = new HttpEntity<>(requestBody.length > 0 ? requestBody : null, headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(targetUri, method, entity, byte[].class);

            // Forward response headers back to the client (strip hop-by-hop)
            HttpHeaders responseHeaders = new HttpHeaders();
            response.getHeaders().forEach((key, values) -> {
                if (!isHopByHopHeader(key)) {
                    responseHeaders.addAll(key, values);
                }
            });
            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());

        } catch (HttpStatusCodeException ex) {
            // Backend returned an error — proxy it as-is (preserves FastAPI error shapes)
            log.warn("[Gateway] Backend error {}: {}", ex.getStatusCode(), ex.getMessage());
            return ResponseEntity.status(ex.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ex.getResponseBodyAsByteArray());

        } catch (ResourceAccessException ex) {
            // Backend is unreachable — return a structured JSON error the UI can render
            log.error("[Gateway] Backend unreachable: {}", ex.getMessage());
            String errorJson = """
                {
                  "error": true,
                  "errorTitle": "Backend Unavailable",
                  "errorMessage": "The SatQuery Python backend is not reachable at %s. Start it with: npm run dev:backend",
                  "suggestion": "Run: python -m uvicorn backend.main:app --port 8000"
                }
                """.formatted(backendUrl);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorJson.getBytes(StandardCharsets.UTF_8));
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
