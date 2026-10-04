package com.studysphere.backend.service;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class GeminiServiceTest {

    @BeforeAll
    public static void setupEnv() {
        String[] candidatePaths = {".env", "backend/.env", "../backend/.env", "../../backend/.env"};
        for (String path : candidatePaths) {
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) ||
                                (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
    }

    @Test
    public void testChatJavaOOP() {
        GeminiService geminiService = new GeminiService();
        ReflectionTestUtils.setField(geminiService, "geminiModel", "gemini-3.5-flash");
        ReflectionTestUtils.setField(geminiService, "geminiApiUrl", "https://generativelanguage.googleapis.com/v1beta/models");

        List<Map<String, String>> history = List.of(
            Map.of("role", "user", "content", "What is Java OOP? Explain simply in one short paragraph.")
        );

        String response = geminiService.chat(history, "You are a concise tutor.");
        assertNotNull(response);
        assertFalse(response.isBlank());
        assertFalse(response.startsWith("I'm sorry, I'm having trouble connecting"));
        assertTrue(response.toLowerCase().contains("object") || response.toLowerCase().contains("class") || response.toLowerCase().contains("oop") || response.toLowerCase().contains("program"));
    }

    @Test
    public void testGenerateQuestions() {
        GeminiService geminiService = new GeminiService();
        ReflectionTestUtils.setField(geminiService, "geminiModel", "gemini-3.5-flash");
        ReflectionTestUtils.setField(geminiService, "geminiApiUrl", "https://generativelanguage.googleapis.com/v1beta/models");

        List<Map<String, Object>> questions = geminiService.generateQuestions("Data Structures", "Easy", 3);
        assertNotNull(questions);
        assertFalse(questions.isEmpty());
        assertEquals(3, questions.size());
        assertTrue(questions.get(0).containsKey("text"));
        assertTrue(questions.get(0).containsKey("optionA"));
        assertTrue(questions.get(0).containsKey("correctOption"));
    }

    @Test
    public void testGenerateFlashcards() {
        GeminiService geminiService = new GeminiService();
        ReflectionTestUtils.setField(geminiService, "geminiModel", "gemini-3.5-flash");
        ReflectionTestUtils.setField(geminiService, "geminiApiUrl", "https://generativelanguage.googleapis.com/v1beta/models");

        List<Map<String, String>> cards = geminiService.generateFlashcards("Operating Systems", "Process Management", "Deadlocks", 3, "Medium", "Banker's Algorithm");
        assertNotNull(cards);
        assertFalse(cards.isEmpty());
        assertTrue(cards.get(0).containsKey("front"));
        assertTrue(cards.get(0).containsKey("back"));
    }

    @Test
    public void testGenerateStudyPlan() {
        GeminiService geminiService = new GeminiService();
        ReflectionTestUtils.setField(geminiService, "geminiModel", "gemini-3.5-flash");
        ReflectionTestUtils.setField(geminiService, "geminiApiUrl", "https://generativelanguage.googleapis.com/v1beta/models");

        Map<String, Object> plan = geminiService.generateStudyPlan(
            "2026-10-15",
            3.0,
            "Evening",
            List.of(Map.of("subject", "Database Management", "topics", List.of("SQL Queries", "Normalization", "Indexing"))),
            List.of("Database Management"),
            "DBMS Exam Prep"
        );

        assertNotNull(plan);
        assertTrue(plan.containsKey("title"));
        assertTrue(plan.containsKey("tasks"));
    }
}
