package com.studysphere.backend.controller;

import com.studysphere.backend.service.StudyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study-plans")
@RequiredArgsConstructor
public class StudyPlanController {

    private final StudyPlanService studyPlanService;

    @PostMapping({"/generate", "/generate-ai"})
    public ResponseEntity<?> generatePlan(@RequestBody Map<String, Object> request) {
        try {
            Long studentId = request.get("studentId") != null && !request.get("studentId").toString().isBlank()
                ? Long.valueOf(request.get("studentId").toString()) : null;
            Map<String, Object> result = studyPlanService.generatePlan(studentId, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error generating study plan: " + e.getMessage()));
        }
    }

    @PostMapping({"", "/save"})
    public ResponseEntity<?> savePlan(@RequestBody Map<String, Object> request) {
        try {
            Long studentId = request.get("studentId") != null && !request.get("studentId").toString().isBlank()
                ? Long.valueOf(request.get("studentId").toString()) : null;
            Map<String, Object> saved = studyPlanService.savePlan(studentId, request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error saving study plan: " + e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getStudentPlans(@PathVariable Long studentId) {
        List<Map<String, Object>> plans = studyPlanService.getStudentPlans(studentId);
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPlanDetails(@PathVariable Long id) {
        try {
            Map<String, Object> plan = studyPlanService.getPlanDetails(id);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", "Plan not found: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable Long id, @RequestBody Map<String, Object> updateData) {
        try {
            Map<String, Object> updated = studyPlanService.updatePlan(id, updateData);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error updating plan: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable Long id) {
        try {
            studyPlanService.deletePlan(id);
            return ResponseEntity.ok(Map.of("message", "Study plan deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error deleting plan: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/tasks")
    public ResponseEntity<?> addTask(@PathVariable Long id, @RequestBody Map<String, Object> taskData) {
        try {
            Map<String, Object> created = studyPlanService.addTask(id, taskData);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error adding task: " + e.getMessage()));
        }
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable Long taskId, @RequestBody Map<String, Object> taskData) {
        try {
            Map<String, Object> updated = studyPlanService.updateTask(taskId, taskData);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error updating task: " + e.getMessage()));
        }
    }

    @PatchMapping("/tasks/{taskId}/toggle")
    public ResponseEntity<?> toggleTaskStatus(@PathVariable Long taskId) {
        try {
            Map<String, Object> toggled = studyPlanService.toggleTaskStatus(taskId);
            return ResponseEntity.ok(toggled);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error toggling task: " + e.getMessage()));
        }
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId) {
        try {
            studyPlanService.deleteTask(taskId);
            return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error deleting task: " + e.getMessage()));
        }
    }
}
