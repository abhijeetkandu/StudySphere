package com.studysphere.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${frontend.url:https://studysphereplatform.netlify.app}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = new ArrayList<>(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:3000"
        ));

        if (frontendUrl != null && !frontendUrl.trim().isEmpty()) {
            for (String url : frontendUrl.split(",")) {
                String trimmed = url.trim();
                if (!trimmed.isEmpty() && !origins.contains(trimmed)) {
                    origins.add(trimmed);
                }
            }
        }

        if (!origins.contains("https://studysphereplatform.netlify.app")) {
            origins.add("https://studysphereplatform.netlify.app");
        }

        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
