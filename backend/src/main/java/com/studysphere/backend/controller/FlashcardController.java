package com.studysphere.backend.controller;

import com.studysphere.backend.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @PostMapping({"/generate", "/generate-ai"})
    public ResponseEntity<?> generateFlashcards(@RequestBody Map<String, Object> request) {
        try {
            Long studentId = request.get("studentId") != null && !request.get("studentId").toString().isBlank() 
                ? Long.valueOf(request.get("studentId").toString()) : null;
            Long subjectId = request.get("subjectId") != null && !request.get("subjectId").toString().isBlank()
                ? Long.valueOf(request.get("subjectId").toString()) : null;
            String topic = (String) request.get("topic");
            int count = request.get("count") != null ? Integer.parseInt(request.get("count").toString()) : 6;

            // If called from deck view with subjectId & topic, save into student's deck automatically
            if (studentId != null && subjectId != null) {
                List<Map<String, Object>> cards = flashcardService.generateAndSaveAIFlashcards(studentId, subjectId, topic, count);
                return ResponseEntity.ok(cards);
            }

            Map<String, Object> result = flashcardService.generateFlashcards(studentId, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error generating flashcards: " + e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/subject/{subjectId}")
    public ResponseEntity<List<Map<String, Object>>> getCardsForStudentAndSubject(
            @PathVariable Long studentId, 
            @PathVariable Long subjectId) {
        List<Map<String, Object>> cards = flashcardService.getCardsForStudentAndSubject(studentId, subjectId);
        return ResponseEntity.ok(cards);
    }

    @PostMapping
    public ResponseEntity<?> createManualCard(@RequestBody Map<String, Object> body) {
        try {
            Long studentId = Long.valueOf(body.get("studentId").toString());
            Long subjectId = Long.valueOf(body.get("subjectId").toString());
            String frontText = (String) body.get("frontText");
            String backText = (String) body.get("backText");
            String topic = (String) body.getOrDefault("topic", "General");

            Map<String, Object> created = flashcardService.createManualCard(studentId, subjectId, frontText, backText, topic);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error creating flashcard: " + e.getMessage()));
        }
    }

    @PatchMapping("/{cardId}/toggle-known")
    public ResponseEntity<?> toggleCardKnown(@PathVariable Long cardId) {
        try {
            Map<String, Object> updated = flashcardService.toggleCardKnown(cardId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error toggling card: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<?> deleteCard(@PathVariable Long cardId) {
        try {
            flashcardService.deleteCard(cardId);
            return ResponseEntity.ok(Map.of("message", "Flashcard deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error deleting card: " + e.getMessage()));
        }
    }

    @PostMapping("/sets")
    public ResponseEntity<?> saveFlashcardSet(@RequestBody Map<String, Object> payload) {
        try {
            Long studentId = Long.valueOf(payload.get("studentId").toString());
            Map<String, Object> saved = flashcardService.saveFlashcardSet(studentId, payload);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error saving flashcard set: " + e.getMessage()));
        }
    }

    @GetMapping("/sets/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getStudentFlashcardSets(@PathVariable Long studentId) {
        List<Map<String, Object>> sets = flashcardService.getStudentSets(studentId);
        return ResponseEntity.ok(sets);
    }

    @GetMapping("/sets/{setId}")
    public ResponseEntity<?> getFlashcardSetDetails(@PathVariable Long setId) {
        try {
            Map<String, Object> setDetails = flashcardService.getSetDetails(setId);
            return ResponseEntity.ok(setDetails);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", "Flashcard set not found: " + e.getMessage()));
        }
    }

    @PatchMapping("/cards/{cardId}/status")
    public ResponseEntity<?> updateCardStatus(@PathVariable Long cardId, @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            Map<String, Object> updated = flashcardService.updateCardStatus(cardId, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error updating card status: " + e.getMessage()));
        }
    }

    @DeleteMapping("/sets/{setId}")
    public ResponseEntity<?> deleteFlashcardSet(@PathVariable Long setId) {
        try {
            flashcardService.deleteSet(setId);
            return ResponseEntity.ok(Map.of("message", "Flashcard set deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Error deleting flashcard set: " + e.getMessage()));
        }
    }
}
