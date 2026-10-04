package com.studysphere.backend.controller;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import com.studysphere.backend.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final GeminiService geminiService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    @PostMapping("/quiz/generate")
    public ResponseEntity<?> generateQuiz(@RequestBody Map<String, Object> payload) {
        try {
            String topic = (String) payload.getOrDefault("topic", "General Knowledge");
            String difficulty = (String) payload.getOrDefault("difficulty", "Medium");
            int numQuestions = payload.get("numQuestions") != null ? Integer.parseInt(payload.get("numQuestions").toString()) : 5;

            List<Map<String, Object>> generatedQuestions = geminiService.generateQuestions(topic, difficulty, numQuestions);
            
            if (generatedQuestions == null || generatedQuestions.isEmpty()) {
                return ResponseEntity.status(500).body(Map.of("message", "Failed to generate questions or received invalid format from AI."));
            }
            
            return ResponseEntity.ok(generatedQuestions);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "An error occurred during AI generation."));
        }
    }

    // AI Assistant Endpoints

    @GetMapping("/conversations/student/{studentId}")
    public ResponseEntity<?> getConversations(@PathVariable Long studentId) {
        List<AiConversation> convs = conversationRepository.findByStudentIdOrderByStartedAtDesc(studentId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AiConversation c : convs) {
            result.add(Map.of(
                "id", c.getId(),
                "title", c.getTitle(),
                "startedAt", c.getStartedAt() != null ? c.getStartedAt().toString() : ""
            ));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(@RequestBody Map<String, Object> payload) {
        Long studentId = Long.valueOf(payload.get("studentId").toString());
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

        AiConversation conv = new AiConversation();
        conv.setStudent(student);
        conv.setTitle((String) payload.getOrDefault("title", "New Conversation"));
        conv.setStartedAt(LocalDateTime.now());
        
        if (payload.get("subjectId") != null && !payload.get("subjectId").toString().isEmpty()) {
            Subject s = subjectRepository.findById(Long.valueOf(payload.get("subjectId").toString())).orElse(null);
            conv.setSubject(s);
        }
        
        if (payload.get("contextNotes") != null) {
            conv.setContextNotes((String) payload.get("contextNotes"));
        }

        conversationRepository.save(conv);
        return ResponseEntity.ok(Map.of("id", conv.getId(), "title", conv.getTitle()));
    }

    @DeleteMapping("/conversations/{convId}")
    public ResponseEntity<?> deleteConversation(@PathVariable Long convId) {
        // Cascade delete will remove messages if configured, else manual deletion needed. 
        // We didn't configure cascade in entity for simplicity, so delete messages first.
        List<AiMessage> msgs = messageRepository.findByConversationIdOrderByTimestampAsc(convId);
        messageRepository.deleteAll(msgs);
        conversationRepository.deleteById(convId);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/conversations/{convId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long convId) {
        List<AiMessage> msgs = messageRepository.findByConversationIdOrderByTimestampAsc(convId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AiMessage m : msgs) {
            result.add(Map.of(
                "role", m.getRole(),
                "content", m.getContent()
            ));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/conversations/{convId}/chat")
    public ResponseEntity<?> chat(@PathVariable Long convId, @RequestBody Map<String, String> payload) {
        AiConversation conv = conversationRepository.findById(convId).orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        String userText = payload.get("text");
        
        // Save user message
        AiMessage userMsg = new AiMessage();
        userMsg.setConversation(conv);
        userMsg.setRole("user");
        userMsg.setContent(userText);
        userMsg.setTimestamp(LocalDateTime.now());
        messageRepository.save(userMsg);

        // Fetch history for Gemini
        List<AiMessage> history = messageRepository.findByConversationIdOrderByTimestampAsc(convId);
        List<Map<String, String>> chatHistory = new ArrayList<>();
        for (AiMessage m : history) {
            chatHistory.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }

        // Build context prompt
        String contextPrompt = "";
        if (conv.getSubject() != null) {
            contextPrompt += "The student is asking about the subject: " + conv.getSubject().getName() + ". ";
        }
        if (conv.getContextNotes() != null && !conv.getContextNotes().isEmpty()) {
            contextPrompt += "Additional context: " + conv.getContextNotes() + ". ";
        }

        // Call Gemini
        String aiResponse = geminiService.chat(chatHistory, contextPrompt);

        // Save AI message
        AiMessage aiMsg = new AiMessage();
        aiMsg.setConversation(conv);
        aiMsg.setRole("assistant");
        aiMsg.setContent(aiResponse);
        aiMsg.setTimestamp(LocalDateTime.now());
        messageRepository.save(aiMsg);

        return ResponseEntity.ok(Map.of("role", "assistant", "content", aiResponse));
    }
}
