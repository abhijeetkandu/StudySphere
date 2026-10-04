package com.studysphere.backend.controller;

import com.studysphere.backend.entity.Announcement;
import com.studysphere.backend.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @GetMapping
    public List<Announcement> getAllAnnouncements() {
        return announcementService.getAllAnnouncements();
    }

    @GetMapping("/published")
    public List<Announcement> getPublishedAnnouncements() {
        return announcementService.getPublishedAnnouncements();
    }

    @GetMapping("/user/{userId}")
    public List<Announcement> getAnnouncementsForUser(@PathVariable Long userId) {
        return announcementService.getAnnouncementsForUser(userId);
    }

    @GetMapping("/author/{authorId}")
    public List<Announcement> getAnnouncementsByAuthor(@PathVariable Long authorId) {
        return announcementService.getAnnouncementsByAuthor(authorId);
    }

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, Object> payload) {
        try {
            Announcement announcement = new Announcement();
            announcement.setTitle((String) payload.get("title"));
            announcement.setMessage((String) payload.get("message"));
            announcement.setTargetAudience((String) payload.getOrDefault("targetAudience", "ALL"));
            if (payload.containsKey("published")) {
                announcement.setPublished((Boolean) payload.get("published"));
            }

            Long authorId = payload.get("authorId") != null ? Long.valueOf(payload.get("authorId").toString()) : null;
            Long subjectId = payload.get("subjectId") != null && !payload.get("subjectId").toString().isEmpty()
                    ? Long.valueOf(payload.get("subjectId").toString())
                    : null;

            if (authorId == null) {
                return ResponseEntity.badRequest().body("authorId is required");
            }

            Announcement created = announcementService.createAnnouncement(announcement, authorId, subjectId);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create announcement: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Announcement announcement = new Announcement();
            announcement.setTitle((String) payload.get("title"));
            announcement.setMessage((String) payload.get("message"));
            announcement.setTargetAudience((String) payload.getOrDefault("targetAudience", "ALL"));
            if (payload.containsKey("published")) {
                announcement.setPublished((Boolean) payload.get("published"));
            }

            Long subjectId = payload.get("subjectId") != null && !payload.get("subjectId").toString().isEmpty()
                    ? Long.valueOf(payload.get("subjectId").toString())
                    : null;

            Announcement updated = announcementService.updateAnnouncement(id, announcement, subjectId);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update announcement: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<?> togglePublish(@PathVariable Long id) {
        Announcement updated = announcementService.togglePublish(id);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        boolean deleted = announcementService.deleteAnnouncement(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
