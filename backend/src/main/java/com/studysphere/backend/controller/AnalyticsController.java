package com.studysphere.backend.controller;

import com.studysphere.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentAnalytics(@PathVariable Long studentId) {
        try {
            Map<String, Object> data = analyticsService.getStudentAnalytics(studentId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching student analytics: " + e.getMessage()));
        }
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getTeacherAnalytics(@PathVariable Long teacherId) {
        try {
            Map<String, Object> data = analyticsService.getTeacherAnalytics(teacherId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching teacher analytics: " + e.getMessage()));
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics() {
        try {
            Map<String, Object> data = analyticsService.getAdminAnalytics();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching admin analytics: " + e.getMessage()));
        }
    }
}
