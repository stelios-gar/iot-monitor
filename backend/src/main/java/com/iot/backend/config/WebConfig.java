package com.iot.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the Angular dev server (http://localhost:4200) to call the REST API.
 *
 * The WebSocket endpoint (see websocket/WebSocketConfig.java) already allows
 * any origin via setAllowedOriginPatterns("*"), so this only affects plain
 * HTTP endpoints under /api/** (e.g. GET /api/data/history).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
