package com.studysphere.backend.controller;

import com.studysphere.backend.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @PostMapping
    public ResponseEntity<?> createReminder(@RequestBody Map<String, Object> data) {
        try {
            Long userId = Long.valueOf(data.get("userId").toString());
            Map<String, Object> created = reminderService.createReminder(userId, data);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error creating reminder: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReminders(@PathVariable Long userId) {
        try {
            Map<String, Object> reminders = reminderService.getUserReminders(userId);
            return ResponseEntity.ok(reminders);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error fetching reminders: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReminderById(@PathVariable Long id) {
        try {
            Map<String, Object> reminder = reminderService.getReminderById(id);
            return ResponseEntity.ok(reminder);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", "Reminder not found: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReminder(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Map<String, Object> updated = reminderService.updateReminder(id, data);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error updating reminder: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleReminder(@PathVariable Long id) {
        try {
            Map<String, Object> toggled = reminderService.toggleReminderCompletion(id);
            return ResponseEntity.ok(toggled);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error toggling reminder: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReminder(@PathVariable Long id) {
        try {
            reminderService.deleteReminder(id);
            return ResponseEntity.ok(Map.of("message", "Reminder deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error deleting reminder: " + e.getMessage()));
        }
    }
}
