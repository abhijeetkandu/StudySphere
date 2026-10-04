package com.studysphere.backend.controller;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    // Get quizzes for a subject
    // Get all quizzes for a subject (Admin/Teacher view)
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<?> getQuizzesForSubject(@PathVariable Long subjectId) {
        List<Quiz> quizzes = quizRepository.findBySubjectId(subjectId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Quiz q : quizzes) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", q.getId());
            map.put("title", q.getTitle());
            map.put("isPublished", q.getIsPublished() != null ? q.getIsPublished() : false);
            if (q.getTeacher() != null) map.put("teacher", q.getTeacher().getName());
            map.put("questionCount", q.getQuestions() != null ? q.getQuestions().size() : 0);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // Get ONLY published quizzes for a subject (Student view)
    @GetMapping("/subject/{subjectId}/published")
    public ResponseEntity<?> getPublishedQuizzesForSubject(@PathVariable Long subjectId) {
        List<Quiz> quizzes = quizRepository.findBySubjectIdAndIsPublishedTrue(subjectId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Quiz q : quizzes) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", q.getId());
            map.put("title", q.getTitle());
            if (q.getTeacher() != null) map.put("teacher", q.getTeacher().getName());
            map.put("questionCount", q.getQuestions() != null ? q.getQuestions().size() : 0);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // Get questions for a quiz
    @GetMapping("/{quizId}/questions")
    public ResponseEntity<?> getQuestions(@PathVariable Long quizId) {
        List<Question> questions = questionRepository.findByQuizId(quizId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", q.getId());
            map.put("text", q.getText());
            map.put("optionA", q.getOptionA());
            map.put("optionB", q.getOptionB());
            map.put("optionC", q.getOptionC());
            map.put("optionD", q.getOptionD());
            map.put("correctOption", q.getCorrectOption()); // Send correct option to frontend for immediate game feedback
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // Create a new quiz
    @PostMapping
    public ResponseEntity<?> createQuiz(@RequestBody Map<String, Object> payload) {
        Quiz q = new Quiz();
        q.setTitle((String) payload.get("title"));

        if (payload.get("subjectId") != null) {
            Subject s = subjectRepository.findById(Long.valueOf(payload.get("subjectId").toString())).orElse(null);
            q.setSubject(s);
        }
        if (payload.get("teacherId") != null) {
            User t = userRepository.findById(Long.valueOf(payload.get("teacherId").toString())).orElse(null);
            q.setTeacher(t);
        }

        Quiz saved = quizRepository.save(q);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Quiz created"));
    }

    // Toggle publish status
    @PutMapping("/{quizId}/publish")
    public ResponseEntity<?> togglePublish(@PathVariable Long quizId, @RequestBody Map<String, Boolean> payload) {
        Quiz q = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        q.setIsPublished(payload.getOrDefault("isPublished", false));
        quizRepository.save(q);
        return ResponseEntity.ok(Map.of("message", "Quiz publish status updated"));
    }

    // Delete a quiz
    @DeleteMapping("/{quizId}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long quizId) {
        quizRepository.deleteById(quizId);
        return ResponseEntity.ok(Map.of("message", "Quiz deleted"));
    }

    // Add a question to a quiz
    @PostMapping("/{quizId}/questions")
    public ResponseEntity<?> addQuestion(@PathVariable Long quizId, @RequestBody Map<String, Object> payload) {
        Quiz q = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));

        Question question = new Question();
        question.setText((String) payload.get("text"));
        question.setOptionA((String) payload.get("optionA"));
        question.setOptionB((String) payload.get("optionB"));
        question.setOptionC((String) payload.get("optionC"));
        question.setOptionD((String) payload.get("optionD"));
        question.setCorrectOption((String) payload.get("correctOption"));
        question.setQuiz(q);

        questionRepository.save(question);
        return ResponseEntity.ok(Map.of("message", "Question added"));
    }

    // Submit an attempt
    @PostMapping("/{quizId}/attempt")
    public ResponseEntity<?> submitAttempt(@PathVariable Long quizId, @RequestBody Map<String, Object> payload) {
        Quiz q = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        if (q.getIsPublished() == null || !q.getIsPublished()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot attempt an unpublished quiz"));
        }

        User student = userRepository.findById(Long.valueOf(payload.get("studentId").toString())).orElseThrow(() -> new RuntimeException("Student not found"));

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(q);
        attempt.setStudent(student);
        attempt.setScore((Integer) payload.get("score"));
        attempt.setCorrectAnswers((Integer) payload.get("correctAnswers"));
        attempt.setWrongAnswers((Integer) payload.get("wrongAnswers"));
        attempt.setCompletionTimeSeconds(Long.valueOf(payload.get("completionTimeSeconds").toString()));
        attempt.setAttemptDate(LocalDateTime.now());

        quizAttemptRepository.save(attempt);
        return ResponseEntity.ok(Map.of("message", "Attempt recorded"));
    }

    // Leaderboard
    @GetMapping("/{quizId}/leaderboard")
    public ResponseEntity<?> getLeaderboard(@PathVariable Long quizId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdOrderByScoreDescCompletionTimeSecondsAsc(quizId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        int rank = 1;
        for (QuizAttempt a : attempts) {
            Map<String, Object> map = new HashMap<>();
            map.put("rank", rank++);
            map.put("studentName", a.getStudent() != null ? a.getStudent().getName() : "Unknown");
            map.put("score", a.getScore());
            map.put("timeSeconds", a.getCompletionTimeSeconds());
            map.put("date", a.getAttemptDate() != null ? a.getAttemptDate().toString() : "");
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
