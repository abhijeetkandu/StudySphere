package com.studysphere.backend.controller;

import com.studysphere.backend.entity.CalendarEvent;
import com.studysphere.backend.service.CalendarEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
public class CalendarEventController {

    @Autowired
    private CalendarEventService calendarEventService;

    @GetMapping
    public List<CalendarEvent> getAllEvents(@RequestParam(required = false) String academicYear) {
        if (academicYear != null && !academicYear.isBlank()) {
            return calendarEventService.getPublishedEvents(academicYear);
        }
        return calendarEventService.getAllEvents();
    }

    @GetMapping("/student/{studentId}")
    public List<CalendarEvent> getStudentEvents(@PathVariable Long studentId,
                                                @RequestParam(required = false) String academicYear) {
        return calendarEventService.getEventsForStudent(studentId, academicYear);
    }

    @GetMapping("/teacher/{teacherId}")
    public List<CalendarEvent> getTeacherEvents(@PathVariable Long teacherId,
                                                @RequestParam(required = false) String academicYear) {
        return calendarEventService.getEventsForTeacher(teacherId, academicYear);
    }

    @GetMapping("/upcoming/{userId}")
    public List<CalendarEvent> getUpcomingEvents(@PathVariable Long userId,
                                                @RequestParam(required = false, defaultValue = "5") int limit) {
        return calendarEventService.getUpcomingEvents(userId, limit);
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> payload) {
        try {
            CalendarEvent event = new CalendarEvent();
            event.setTitle((String) payload.get("title"));
            event.setDescription((String) payload.get("description"));
            event.setEventDate((String) payload.get("eventDate"));
            event.setEventType((String) payload.getOrDefault("eventType", "COLLEGE_EVENT"));
            event.setStartTime((String) payload.get("startTime"));
            event.setEndTime((String) payload.get("endTime"));
            event.setAcademicYear((String) payload.get("academicYear"));
            if (payload.containsKey("published")) {
                event.setPublished((Boolean) payload.get("published"));
            }

            Long createdById = payload.get("createdById") != null && !payload.get("createdById").toString().isEmpty()
                    ? Long.valueOf(payload.get("createdById").toString()) : null;
            Long courseId = payload.get("courseId") != null && !payload.get("courseId").toString().isEmpty()
                    ? Long.valueOf(payload.get("courseId").toString()) : null;
            Long semesterId = payload.get("semesterId") != null && !payload.get("semesterId").toString().isEmpty()
                    ? Long.valueOf(payload.get("semesterId").toString()) : null;

            if (event.getTitle() == null || event.getEventDate() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Title and Event Date are required."));
            }

            CalendarEvent created = calendarEventService.createEvent(event, createdById, courseId, semesterId);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create calendar event: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            CalendarEvent event = new CalendarEvent();
            event.setTitle((String) payload.get("title"));
            event.setDescription((String) payload.get("description"));
            event.setEventDate((String) payload.get("eventDate"));
            event.setEventType((String) payload.getOrDefault("eventType", "COLLEGE_EVENT"));
            event.setStartTime((String) payload.get("startTime"));
            event.setEndTime((String) payload.get("endTime"));
            event.setAcademicYear((String) payload.get("academicYear"));
            if (payload.containsKey("published")) {
                event.setPublished((Boolean) payload.get("published"));
            }

            Long courseId = payload.get("courseId") != null && !payload.get("courseId").toString().isEmpty()
                    ? Long.valueOf(payload.get("courseId").toString()) : null;
            Long semesterId = payload.get("semesterId") != null && !payload.get("semesterId").toString().isEmpty()
                    ? Long.valueOf(payload.get("semesterId").toString()) : null;

            CalendarEvent updated = calendarEventService.updateEvent(id, event, courseId, semesterId);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update calendar event: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<?> togglePublish(@PathVariable Long id) {
        CalendarEvent updated = calendarEventService.togglePublish(id);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        boolean deleted = calendarEventService.deleteEvent(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Calendar event deleted successfully."));
        }
        return ResponseEntity.notFound().build();
    }
}
