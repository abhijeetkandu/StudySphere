package com.studysphere.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String geminiApiUrl;

    @Value("${gemini.model:gemini-3.5-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedApiKey = null;

    private String resolveApiKey() {
        if (cachedApiKey != null && !cachedApiKey.isBlank()) {
            return cachedApiKey;
        }
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            cachedApiKey = geminiApiKey.trim();
            return cachedApiKey;
        }
        String sysProp = System.getProperty("GEMINI_API_KEY");
        if (sysProp != null && !sysProp.isBlank()) {
            cachedApiKey = sysProp.trim();
            return cachedApiKey;
        }
        String envVal = System.getenv("GEMINI_API_KEY");
        if (envVal != null && !envVal.isBlank()) {
            cachedApiKey = envVal.trim();
            return cachedApiKey;
        }

        // Direct fallback to candidate .env file locations
        String[] candidateFiles = {
            ".env",
            "backend/.env",
            "../.env",
            "../backend/.env"
        };

        for (String p : candidateFiles) {
            File file = new File(p);
            if (file.exists() && file.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String k = line.substring(0, eqIdx).trim();
                            String v = line.substring(eqIdx + 1).trim();
                            if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
                                v = v.substring(1, v.length() - 1);
                            }
                            if ("GEMINI_API_KEY".equalsIgnoreCase(k) && !v.isBlank()) {
                                cachedApiKey = v;
                                return cachedApiKey;
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        return "";
    }

    private String resolveModel() {
        if (geminiModel != null && !geminiModel.isBlank()) {
            return geminiModel.trim();
        }
        String sysProp = System.getProperty("GEMINI_MODEL");
        if (sysProp != null && !sysProp.isBlank()) {
            return sysProp.trim();
        }
        String envVal = System.getenv("GEMINI_MODEL");
        if (envVal != null && !envVal.isBlank()) {
            return envVal.trim();
        }
        return "gemini-3.5-flash";
    }

    private String resolveBaseApiUrl() {
        String base = (geminiApiUrl != null && !geminiApiUrl.isBlank()) 
            ? geminiApiUrl.trim() 
            : "https://generativelanguage.googleapis.com/v1beta/models";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base;
    }

    private String callGeminiWithModel(Map<String, Object> requestBody, String apiKey, String model) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        String endpoint = resolveBaseApiUrl() + "/" + model + ":generateContent";
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode part : parts) {
                        if (part.has("text") && !part.path("thought").asBoolean(false)) {
                            sb.append(part.path("text").asText());
                        }
                    }
                    if (!sb.isEmpty()) {
                        return sb.toString();
                    }
                    return parts.get(0).path("text").asText();
                }
            }
        }
        throw new RuntimeException("Empty or invalid response received from Gemini API");
    }

    private String callGemini(Map<String, Object> requestBody, String apiKey) throws Exception {
        String primaryModel = resolveModel();
        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(primaryModel);
        if (!"gemini-3.5-flash".equals(primaryModel)) modelsToTry.add("gemini-3.5-flash");
        if (!"gemini-flash-latest".equals(primaryModel)) modelsToTry.add("gemini-flash-latest");
        if (!"gemini-3.5-flash-lite".equals(primaryModel)) modelsToTry.add("gemini-3.5-flash-lite");

        Exception lastEx = null;
        for (String m : modelsToTry) {
            try {
                return callGeminiWithModel(requestBody, apiKey, m);
            } catch (Exception e) {
                lastEx = e;
            }
        }
        throw (lastEx != null) ? lastEx : new RuntimeException("All Gemini model attempts failed");
    }

    public List<Map<String, Object>> generateQuestions(String topic, String difficulty, int numQuestions) {
        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            System.err.println("Warning: GEMINI_API_KEY is not configured.");
            return generateFallbackQuestions(topic, difficulty, numQuestions);
        }

        String prompt = String.format(
            "You are an expert educator. Generate exactly %d multiple-choice questions about '%s' at a '%s' difficulty level. " +
            "You MUST respond ONLY with a valid JSON array of objects. Do not include markdown formatting or any other text. " +
            "Each object must have the following keys: 'text' (the question), 'optionA', 'optionB', 'optionC', 'optionD', and 'correctOption' (must be exactly 'A', 'B', 'C', or 'D').",
            numQuestions, topic, difficulty
        );

        Map<String, Object> requestBody = new HashMap<>();
        
        requestBody.put("systemInstruction", Map.of(
            "parts", List.of(Map.of("text", "You are a JSON-only API that outputs multiple choice questions. Output only valid JSON without markdown code fences."))
        ));

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", prompt))
        ));
        requestBody.put("contents", contents);

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", genConfig);

        try {
            String text = callGemini(requestBody, apiKey);
            String cleaned = cleanJsonContent(text);
            return objectMapper.readValue(cleaned, objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
        } catch (Exception e) {
            System.err.println("Gemini generateQuestions API call failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }

        return generateFallbackQuestions(topic, difficulty, numQuestions);
    }

    public String chat(List<Map<String, String>> conversationHistory, String contextPrompt) {
        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            System.err.println("Warning: GEMINI_API_KEY is not configured.");
            return "I'm sorry, the AI Assistant API key is not configured. Please check your application environment settings.";
        }

        Map<String, Object> requestBody = new HashMap<>();
        
        String systemContent = "You are StudySphere's AI Study Assistant. You help college students understand their course material. Be encouraging, clear, and academic. Do not give direct answers to quizzes or assignments, guide them to the answer. " + (contextPrompt != null ? contextPrompt : "");
        requestBody.put("systemInstruction", Map.of(
            "parts", List.of(Map.of("text", systemContent))
        ));

        List<Map<String, Object>> contents = new ArrayList<>();
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            String lastRole = null;
            for (Map<String, String> msg : conversationHistory) {
                String role = "user".equalsIgnoreCase(msg.get("role")) ? "user" : "model";
                String text = msg.get("content");
                if (text == null || text.isBlank()) continue;

                if (role.equals(lastRole) && !contents.isEmpty()) {
                    Map<String, Object> prev = contents.get(contents.size() - 1);
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> prevParts = (List<Map<String, String>>) prev.get("parts");
                    List<Map<String, String>> updatedParts = new ArrayList<>(prevParts);
                    updatedParts.add(Map.of("text", text));
                    prev.put("parts", updatedParts);
                } else {
                    contents.add(new HashMap<>(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", text))
                    )));
                    lastRole = role;
                }
            }
        }

        if (contents.isEmpty()) {
            contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", "Hello!"))
            ));
        }

        requestBody.put("contents", contents);
        requestBody.put("generationConfig", Map.of("temperature", 0.7));

        try {
            return callGemini(requestBody, apiKey);
        } catch (Exception e) {
            System.err.println("Gemini chat API call failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
        }
    }

    public Map<String, Object> generateStudyPlan(String examDate, Double hoursPerDay, String preferredTime, List<Map<String, Object>> subjectTopicsList, List<String> prioritySubjects, String title) {
        double hours = (hoursPerDay != null && hoursPerDay > 0) ? hoursPerDay : 3.0;
        String prefTime = (preferredTime != null && !preferredTime.isBlank()) ? preferredTime : "Flexible";
        String targetTitle = (title != null && !title.isBlank()) ? title : "Personalized AI Study Plan";

        // Build subject and topic text
        StringBuilder subjectsText = new StringBuilder();
        if (subjectTopicsList != null && !subjectTopicsList.isEmpty()) {
            for (Map<String, Object> item : subjectTopicsList) {
                String subName = (String) item.get("subject");
                Object topicsObj = item.get("topics");
                subjectsText.append("- Subject: ").append(subName);
                if (topicsObj instanceof List && !((List<?>) topicsObj).isEmpty()) {
                    subjectsText.append(" (Topics: ").append(String.join(", ", ((List<?>) topicsObj).stream().map(Object::toString).toList())).append(")");
                }
                subjectsText.append("\n");
            }
        } else {
            subjectsText.append("- General Subject Review\n");
        }

        String priorityText = (prioritySubjects != null && !prioritySubjects.isEmpty()) 
            ? String.join(", ", prioritySubjects) 
            : "None specified";

        String prompt = String.format(
            "You are an expert academic tutor and study planner for college students. " +
            "Create a realistic, day-by-day study plan starting from today until the exam date '%s'.\n\n" +
            "Student Study Requirements:\n" +
            "- Daily Study Time: %.1f hours per day\n" +
            "- Preferred Study Slot: %s\n" +
            "- Subjects & Topics to cover:\n%s\n" +
            "- High Priority / Weak Subjects to give extra focus: %s\n\n" +
            "Rules:\n" +
            "1. Spread the key study milestones across the available days leading up to the exam (generate between 5 and 10 focused, high-value tasks in total).\n" +
            "2. Allocate more time, earlier scheduling, and revision slots to high priority / weak subjects.\n" +
            "3. Total planned duration for tasks in each day should approximate %.1f hours (in minutes, e.g. %d minutes).\n" +
            "4. Tasks must be specific and actionable (e.g. 'Read Chapter 2 & Make Notes', 'Solve 10 Practice Problems', 'Review Formulas', 'Mock Test & Analysis').\n" +
            "5. You MUST respond ONLY with a valid JSON object. Do not include markdown code block tags or extra explanation.\n" +
            "The JSON structure MUST BE:\n" +
            "{\n" +
            "  \"title\": \"%s\",\n" +
            "  \"summary\": \"Brief overview and motivational study advice for the student.\",\n" +
            "  \"tasks\": [\n" +
            "    {\n" +
            "      \"studyDate\": \"YYYY-MM-DD\",\n" +
            "      \"subject\": \"Subject Name\",\n" +
            "      \"topic\": \"Topic Name\",\n" +
            "      \"taskDescription\": \"Actionable study task description\",\n" +
            "      \"plannedDurationMinutes\": 60,\n" +
            "      \"isCompleted\": false\n" +
            "    }\n" +
            "  ]\n" +
            "}",
            examDate, hours, prefTime, subjectsText.toString(), priorityText, hours, (int)(hours * 60), targetTitle
        );

        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            System.err.println("Warning: GEMINI_API_KEY is not configured, falling back to algorithmic planner.");
            return generateFallbackStudyPlan(examDate, hours, prefTime, subjectTopicsList, prioritySubjects, targetTitle);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("systemInstruction", Map.of(
            "parts", List.of(Map.of("text", "You are a JSON-only API that outputs structured study schedules. Output only valid JSON without markdown fences."))
        ));

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", prompt))
        ));
        requestBody.put("contents", contents);

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("maxOutputTokens", 3500);
        genConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", genConfig);

        try {
            String text = callGemini(requestBody, apiKey);
            String cleaned = cleanJsonContent(text);
            Map<String, Object> parsed = objectMapper.readValue(cleaned, objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
            if (parsed != null && parsed.containsKey("tasks")) {
                return parsed;
            }
        } catch (Exception e) {
            System.err.println("Gemini study plan generation API call failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }

        return generateFallbackStudyPlan(examDate, hours, prefTime, subjectTopicsList, prioritySubjects, targetTitle);
    }

    public List<Map<String, String>> generateFlashcards(String subject, String chapter, String topic, int count, String difficulty, String customFocus) {
        int targetCount = (count > 0 && count <= 30) ? count : 10;
        String diff = (difficulty != null && !difficulty.isBlank()) ? difficulty : "Medium";
        
        StringBuilder context = new StringBuilder();
        if (subject != null && !subject.isBlank()) context.append("Subject: ").append(subject).append(". ");
        if (chapter != null && !chapter.isBlank()) context.append("Chapter: ").append(chapter).append(". ");
        if (topic != null && !topic.isBlank()) context.append("Topic: ").append(topic).append(". ");
        if (customFocus != null && !customFocus.isBlank()) context.append("Key Focus/Keywords: ").append(customFocus).append(". ");

        String prompt = String.format(
            "You are an expert academic professor. Generate exactly %d high-yield educational flashcards for a college student on '%s' at '%s' difficulty level.\n" +
            "Rules:\n" +
            "1. 'front' should be a concise question, formula, key concept, or problem statement.\n" +
            "2. 'back' should be a clear, accurate, and comprehensive explanation or solution with key takeaways.\n" +
            "3. You MUST respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting or extra commentary.\n" +
            "Each object must have the exact keys 'front' and 'back'.\n" +
            "Example format:\n" +
            "[\n" +
            "  {\n" +
            "    \"front\": \"What is Dijkstra's algorithm used for?\",\n" +
            "    \"back\": \"Finding the shortest paths between nodes in a weighted graph with non-negative edge weights.\"\n" +
            "  }\n" +
            "]",
            targetCount, context.toString(), diff
        );

        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            System.err.println("Warning: GEMINI_API_KEY is not configured, falling back to algorithmic card generator.");
            return generateFallbackFlashcards(subject, chapter, topic, targetCount, customFocus);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("systemInstruction", Map.of(
            "parts", List.of(Map.of("text", "You are a JSON-only API that outputs educational flashcards. Output only valid JSON without markdown fences."))
        ));

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", prompt))
        ));
        requestBody.put("contents", contents);

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("maxOutputTokens", 3000);
        genConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", genConfig);

        try {
            String text = callGemini(requestBody, apiKey);
            String cleaned = cleanJsonContent(text);
            List<Map<String, String>> parsed = objectMapper.readValue(cleaned, objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            if (parsed != null && !parsed.isEmpty()) {
                return parsed;
            }
        } catch (Exception e) {
            System.err.println("Gemini flashcards API call failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }

        return generateFallbackFlashcards(subject, chapter, topic, targetCount, customFocus);
    }

    private String cleanJsonContent(String content) {
        if (content == null) return "{}";
        content = content.trim();
        int jsonStart = content.indexOf("```json");
        if (jsonStart != -1) {
            int blockEnd = content.indexOf("```", jsonStart + 7);
            if (blockEnd != -1) {
                return content.substring(jsonStart + 7, blockEnd).trim();
            } else {
                return content.substring(jsonStart + 7).trim();
            }
        }
        int codeStart = content.indexOf("```");
        if (codeStart != -1) {
            int blockEnd = content.indexOf("```", codeStart + 3);
            if (blockEnd != -1) {
                return content.substring(codeStart + 3, blockEnd).trim();
            } else {
                return content.substring(codeStart + 3).trim();
            }
        }
        int firstBrace = content.indexOf('{');
        int firstBracket = content.indexOf('[');
        int start = -1;
        if (firstBrace != -1 && firstBracket != -1) {
            start = Math.min(firstBrace, firstBracket);
        } else if (firstBrace != -1) {
            start = firstBrace;
        } else if (firstBracket != -1) {
            start = firstBracket;
        }
        if (start > 0) {
            content = content.substring(start);
        }
        int lastBrace = content.lastIndexOf('}');
        int lastBracket = content.lastIndexOf(']');
        int end = Math.max(lastBrace, lastBracket);
        if (end != -1 && end < content.length() - 1) {
            content = content.substring(0, end + 1);
        }
        return content.trim();
    }

    private List<Map<String, Object>> generateFallbackQuestions(String topic, String difficulty, int count) {
        List<Map<String, Object>> questions = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            Map<String, Object> q = new HashMap<>();
            q.put("text", String.format("Sample Question %d on %s (%s difficulty): What is the core principle?", i, topic, difficulty));
            q.put("optionA", "It optimizes resource utilization and operational throughput");
            q.put("optionB", "It introduces unbounded computational delay");
            q.put("optionC", "It eliminates the requirement for storage systems");
            q.put("optionD", "It is deprecated and unsupported in modern architectures");
            q.put("correctOption", "A");
            questions.add(q);
        }
        return questions;
    }

    private Map<String, Object> generateFallbackStudyPlan(String examDateStr, double hoursPerDay, String preferredTime, List<Map<String, Object>> subjectTopicsList, List<String> prioritySubjects, String title) {
        Map<String, Object> result = new HashMap<>();
        result.put("title", title);
        
        LocalDate startDate = LocalDate.now();
        LocalDate examDate;
        try {
            examDate = (examDateStr != null && !examDateStr.isBlank()) ? LocalDate.parse(examDateStr) : startDate.plusDays(7);
            if (examDate.isBefore(startDate)) {
                examDate = startDate.plusDays(7);
            }
        } catch (Exception e) {
            examDate = startDate.plusDays(7);
        }

        long daysBetween = ChronoUnit.DAYS.between(startDate, examDate);
        if (daysBetween <= 0) daysBetween = 7;
        if (daysBetween > 30) daysBetween = 30;

        StringBuilder summary = new StringBuilder();
        summary.append(String.format("AI Study Strategy: Prepared for exam on %s (%d days available). ", examDate, daysBetween));
        summary.append(String.format("Allocating %.1f hours per day (%s slot). ", hoursPerDay, preferredTime));
        if (prioritySubjects != null && !prioritySubjects.isEmpty()) {
            summary.append("Prioritizing weak subjects: ").append(String.join(", ", prioritySubjects)).append(" with dedicated early deep-dives and revision rounds.");
        } else {
            summary.append("Balanced revision covering all selected subjects and key topics.");
        }
        result.put("summary", summary.toString());

        List<Map<String, String>> items = new ArrayList<>();
        if (subjectTopicsList != null && !subjectTopicsList.isEmpty()) {
            for (Map<String, Object> subMap : subjectTopicsList) {
                String sub = (String) subMap.get("subject");
                Object topObj = subMap.get("topics");
                if (topObj instanceof List && !((List<?>) topObj).isEmpty()) {
                    for (Object top : (List<?>) topObj) {
                        items.add(Map.of("subject", sub, "topic", top.toString()));
                    }
                } else {
                    items.add(Map.of("subject", sub, "topic", "Core Concepts & Fundamentals"));
                }
            }
        }
        if (items.isEmpty()) {
            items.add(Map.of("subject", "General Subject", "topic", "Comprehensive Review"));
        }

        if (prioritySubjects != null && !prioritySubjects.isEmpty()) {
            items.sort((a, b) -> {
                boolean aPri = prioritySubjects.contains(a.get("subject"));
                boolean bPri = prioritySubjects.contains(b.get("subject"));
                if (aPri && !bPri) return -1;
                if (!aPri && bPri) return 1;
                return 0;
            });
        }

        List<Map<String, Object>> tasks = new ArrayList<>();
        int totalMinutesPerDay = (int) (hoursPerDay * 60);
        int itemIndex = 0;

        String[] taskTypes = {
            "Concept Study & Detailed Notes",
            "Problem Solving & Exercise Practice",
            "Deep Dive & Formula Mastery",
            "Past Exam Questions Review",
            "Self-Assessment & Quick Quiz"
        };

        for (int d = 0; d < daysBetween; d++) {
            LocalDate currentDate = startDate.plusDays(d);
            String dateStr = currentDate.toString();
            
            if (d == daysBetween - 1) {
                Map<String, Object> task = new HashMap<>();
                task.put("studyDate", dateStr);
                task.put("subject", "All Subjects");
                task.put("topic", "Final Exam Simulation & Formula Recall");
                task.put("taskDescription", "Full syllabus quick review, formula recap, and mock exam test under timed conditions.");
                task.put("plannedDurationMinutes", totalMinutesPerDay);
                task.put("isCompleted", false);
                tasks.add(task);
                continue;
            }

            int sessionsPerDay = hoursPerDay >= 3 ? 2 : 1;
            int minutesPerSession = totalMinutesPerDay / sessionsPerDay;

            for (int s = 0; s < sessionsPerDay; s++) {
                Map<String, String> currentItem = items.get(itemIndex % items.size());
                itemIndex++;

                String sub = currentItem.get("subject");
                String top = currentItem.get("topic");
                boolean isPri = prioritySubjects != null && prioritySubjects.contains(sub);

                String activity = taskTypes[(d * 2 + s) % taskTypes.length];
                String description = String.format("%s on %s - Focus on key definitions, practice exercises, and summary notes.", activity, top);
                if (isPri) {
                    description = "[Priority Focus] In-depth analysis of " + top + ", clearing doubts, and solving challenging problems.";
                }

                Map<String, Object> task = new HashMap<>();
                task.put("studyDate", dateStr);
                task.put("subject", sub);
                task.put("topic", top);
                task.put("taskDescription", description);
                task.put("plannedDurationMinutes", minutesPerSession);
                task.put("isCompleted", false);
                tasks.add(task);
            }
        }

        result.put("tasks", tasks);
        return result;
    }

    private List<Map<String, String>> generateFallbackFlashcards(String subject, String chapter, String topic, int count, String customFocus) {
        String mainTopic = (topic != null && !topic.isBlank()) ? topic : ((chapter != null && !chapter.isBlank()) ? chapter : ((subject != null && !subject.isBlank()) ? subject : "Core Concepts"));
        String subName = (subject != null && !subject.isBlank()) ? subject : "General Studies";

        List<Map<String, String>> cards = new ArrayList<>();

        String[][] templatePatterns = {
            {"What is the fundamental definition and core principle of %s in %s?", "%s refers to the foundational principle governing this area. Key aspects include standard definitions, core mechanisms, and primary real-world use cases."},
            {"What are the primary components or building blocks of %s?", "The main building blocks include structural elements, operational workflows, inputs, transformation rules, and output states essential for system functioning."},
            {"What are the key advantages and practical benefits of applying %s?", "Key benefits include improved computational efficiency, modularity, reliability, scalability, and simplified maintainability in production environments."},
            {"What common challenges or trade-offs arise when working with %s?", "Common trade-offs involve time vs. space complexity, implementation overhead, synchronization constraints, and resource allocation trade-offs."},
            {"How does %s compare and contrast with alternative approaches?", "%s provides specialized optimization for specific constraints, whereas alternative methods may prioritize simplicity or lower upfront resource demands."},
            {"What is the step-by-step process/algorithm used to execute %s?", "1. Initialization of variables and states.\n2. Iterative processing according to rules.\n3. Validation of boundary conditions.\n4. Final state convergence and output return."},
            {"What are the critical formulas, theorems, or laws associated with %s?", "Standard governing equations, theoretical bounds (e.g. Big-O complexities), and invariant conditions that must hold true during execution."},
            {"How do you troubleshoot or debug common errors in %s?", "Verify input pre-conditions, check boundary/edge cases (e.g., null pointers, division by zero, empty collections), and trace intermediate states step-by-step."},
            {"What are real-world industry applications of %s?", "Widely used in distributed systems, backend architectures, database indexing, networking protocols, and modern web application development."},
            {"What are best practices for optimizing performance in %s?", "Employ efficient data structures, minimize redundant computations (caching/memoization), ensure proper indexing, and avoid unnecessary lock contention."}
        };

        for (int i = 0; i < count; i++) {
            String[] t = templatePatterns[i % templatePatterns.length];
            String front = String.format(t[0], mainTopic, subName);
            String back = String.format(t[1], mainTopic);
            
            if (customFocus != null && !customFocus.isBlank() && i == 0) {
                front = "Key Concept: " + customFocus + " (" + mainTopic + ")";
                back = "Core focus on " + customFocus + ": Essential definitions, rules, problem-solving techniques, and exam review notes.";
            }

            cards.add(Map.of("front", front, "back", back));
        }

        return cards;
    }
}
