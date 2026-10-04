package com.studysphere.backend.service;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardRepository flashcardRepository;
    private final StudyMaterialRepository studyMaterialRepository;

    public Map<String, Object> getStudentAnalytics(Long studentId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);

        int totalAttempted = attempts.size();
        int totalCompleted = (int) attempts.stream().filter(a -> a.getCompletionTimeSeconds() != null && a.getCompletionTimeSeconds() > 0).count();

        double avgScore = attempts.stream()
                .mapToInt(a -> a.getScore() != null ? a.getScore() : 0)
                .average()
                .orElse(0.0);

        int highestScore = attempts.stream()
                .mapToInt(a -> a.getScore() != null ? a.getScore() : 0)
                .max()
                .orElse(0);

        int totalCorrect = attempts.stream()
                .mapToInt(a -> a.getCorrectAnswers() != null ? a.getCorrectAnswers() : 0)
                .sum();

        int totalWrong = attempts.stream()
                .mapToInt(a -> a.getWrongAnswers() != null ? a.getWrongAnswers() : 0)
                .sum();

        int totalAnswers = totalCorrect + totalWrong;
        int accuracyRate = totalAnswers > 0 ? (int) Math.round(((double) totalCorrect / totalAnswers) * 100) : 0;

        // Fetch Study Tasks completed
        List<StudyPlan> plans = studyPlanRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        List<Long> planIds = plans.stream().map(StudyPlan::getId).toList();
        List<StudyTask> tasks = !planIds.isEmpty() ? studyTaskRepository.findByStudyPlanIdIn(planIds) : Collections.emptyList();
        long tasksCompleted = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).count();

        // Fetch Flashcard mastery
        List<FlashcardSet> sets = flashcardSetRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        int totalFlashcards = 0;
        int knownFlashcards = 0;
        for (FlashcardSet s : sets) {
            List<Flashcard> cards = flashcardRepository.findByFlashcardSetIdOrderByOrderIndexAsc(s.getId());
            totalFlashcards += cards.size();
            knownFlashcards += (int) cards.stream().filter(c -> "KNOWN".equalsIgnoreCase(c.getStatus())).count();
        }
        int flashcardMasteryPercent = totalFlashcards > 0 ? (int) Math.round(((double) knownFlashcards / totalFlashcards) * 100) : 0;

        int totalStudySessions = totalAttempted + (int) tasksCompleted + sets.size();

        // Subject-wise performance
        Map<String, List<QuizAttempt>> attemptsBySubject = new HashMap<>();
        for (QuizAttempt a : attempts) {
            String subName = (a.getQuiz() != null && a.getQuiz().getSubject() != null)
                    ? a.getQuiz().getSubject().getName()
                    : "General Subject";
            attemptsBySubject.computeIfAbsent(subName, k -> new ArrayList<>()).add(a);
        }

        List<Map<String, Object>> subjectPerformance = new ArrayList<>();
        List<Map<String, Object>> weakAreas = new ArrayList<>();

        for (Map.Entry<String, List<QuizAttempt>> entry : attemptsBySubject.entrySet()) {
            String subName = entry.getKey();
            List<QuizAttempt> subAttempts = entry.getValue();

            double subAvg = subAttempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0.0);
            int subMax = subAttempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).max().orElse(0);
            int subCorrect = subAttempts.stream().mapToInt(a -> a.getCorrectAnswers() != null ? a.getCorrectAnswers() : 0).sum();
            int subWrong = subAttempts.stream().mapToInt(a -> a.getWrongAnswers() != null ? a.getWrongAnswers() : 0).sum();
            int subTotal = subCorrect + subWrong;
            int subAccuracy = subTotal > 0 ? (int) Math.round(((double) subCorrect / subTotal) * 100) : 0;

            Map<String, Object> subMap = new HashMap<>();
            subMap.put("subject", subName);
            subMap.put("attempts", subAttempts.size());
            subMap.put("averageScore", Math.round(subAvg * 10.0) / 10.0);
            subMap.put("highestScore", subMax);
            subMap.put("correctAnswers", subCorrect);
            subMap.put("wrongAnswers", subWrong);
            subMap.put("accuracy", subAccuracy);
            subjectPerformance.add(subMap);

            if (subAccuracy < 60 || subAvg < 50) {
                Map<String, Object> weakMap = new HashMap<>();
                weakMap.put("subject", subName);
                weakMap.put("accuracy", subAccuracy);
                weakMap.put("averageScore", Math.round(subAvg * 10.0) / 10.0);
                weakMap.put("recommendation", "Review key chapters and generate targeted flashcards on " + subName);
                weakAreas.add(weakMap);
            }
        }

        subjectPerformance.sort((a, b) -> Double.compare((Double) b.get("averageScore"), (Double) a.get("averageScore")));

        // Recent attempts (last 10, newest first)
        List<QuizAttempt> sortedAttempts = new ArrayList<>(attempts);
        sortedAttempts.sort((a, b) -> {
            if (a.getAttemptDate() == null || b.getAttemptDate() == null) return 0;
            return b.getAttemptDate().compareTo(a.getAttemptDate());
        });

        List<Map<String, Object>> recentAttemptsList = new ArrayList<>();
        int count = 0;
        for (QuizAttempt a : sortedAttempts) {
            if (count++ >= 10) break;
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("quizTitle", a.getQuiz() != null ? a.getQuiz().getTitle() : "Quiz");
            map.put("subject", (a.getQuiz() != null && a.getQuiz().getSubject() != null) ? a.getQuiz().getSubject().getName() : "General");
            map.put("score", a.getScore());
            map.put("correctAnswers", a.getCorrectAnswers());
            map.put("wrongAnswers", a.getWrongAnswers());
            map.put("timeSeconds", a.getCompletionTimeSeconds());
            map.put("attemptDate", a.getAttemptDate() != null ? a.getAttemptDate().toString() : "");
            recentAttemptsList.add(map);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalQuizzesAttempted", totalAttempted);
        result.put("totalQuizzesCompleted", totalCompleted);
        result.put("averageScore", Math.round(avgScore * 10.0) / 10.0);
        result.put("highestScore", highestScore);
        result.put("totalCorrectAnswers", totalCorrect);
        result.put("totalWrongAnswers", totalWrong);
        result.put("accuracyRate", accuracyRate);
        result.put("tasksCompleted", tasksCompleted);
        result.put("totalTasks", tasks.size());
        result.put("totalFlashcards", totalFlashcards);
        result.put("knownFlashcards", knownFlashcards);
        result.put("flashcardMasteryPercent", flashcardMasteryPercent);
        result.put("totalStudySessions", totalStudySessions);
        result.put("subjectPerformance", subjectPerformance);
        result.put("weakAreas", weakAreas);
        result.put("recentAttempts", recentAttemptsList);

        return result;
    }

    public Map<String, Object> getTeacherAnalytics(Long teacherId) {
        List<Quiz> teacherQuizzes = quizRepository.findByTeacherId(teacherId);
        List<Long> quizIds = teacherQuizzes.stream().map(Quiz::getId).toList();

        List<QuizAttempt> attempts = new ArrayList<>();
        for (Long qId : quizIds) {
            attempts.addAll(quizAttemptRepository.findByQuizIdOrderByScoreDescCompletionTimeSecondsAsc(qId));
        }

        int totalAttempts = attempts.size();
        double avgScore = attempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0.0);
        int totalCorrect = attempts.stream().mapToInt(a -> a.getCorrectAnswers() != null ? a.getCorrectAnswers() : 0).sum();
        int totalWrong = attempts.stream().mapToInt(a -> a.getWrongAnswers() != null ? a.getWrongAnswers() : 0).sum();
        int totalAnswers = totalCorrect + totalWrong;
        int passCount = (int) attempts.stream().filter(a -> (a.getScore() != null ? a.getScore() : 0) >= 50).count();
        int passRate = totalAttempts > 0 ? (int) Math.round(((double) passCount / totalAttempts) * 100) : 0;

        // Student Leaderboard & Performance Breakdown
        Map<Long, List<QuizAttempt>> attemptsByStudent = new HashMap<>();
        for (QuizAttempt a : attempts) {
            if (a.getStudent() != null) {
                attemptsByStudent.computeIfAbsent(a.getStudent().getId(), k -> new ArrayList<>()).add(a);
            }
        }

        List<Map<String, Object>> studentLeaderboard = new ArrayList<>();
        List<Map<String, Object>> strugglingStudents = new ArrayList<>();

        for (Map.Entry<Long, List<QuizAttempt>> entry : attemptsByStudent.entrySet()) {
            List<QuizAttempt> sAttempts = entry.getValue();
            User student = sAttempts.get(0).getStudent();
            double sAvg = sAttempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0.0);
            int sMax = sAttempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).max().orElse(0);

            Map<String, Object> sMap = new HashMap<>();
            sMap.put("studentId", student.getId());
            sMap.put("studentName", student.getName());
            sMap.put("email", student.getEmail());
            sMap.put("attemptsCount", sAttempts.size());
            sMap.put("averageScore", Math.round(sAvg * 10.0) / 10.0);
            sMap.put("highestScore", sMax);
            studentLeaderboard.add(sMap);

            if (sAvg < 50.0) {
                strugglingStudents.add(sMap);
            }
        }

        studentLeaderboard.sort((a, b) -> Double.compare((Double) b.get("averageScore"), (Double) a.get("averageScore")));

        // Quiz performance overview
        List<Map<String, Object>> quizPerformance = new ArrayList<>();
        for (Quiz q : teacherQuizzes) {
            List<QuizAttempt> qAttempts = attempts.stream().filter(a -> a.getQuiz() != null && Objects.equals(a.getQuiz().getId(), q.getId())).toList();
            double qAvg = qAttempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0.0);

            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("title", q.getTitle());
            qMap.put("subject", q.getSubject() != null ? q.getSubject().getName() : "General");
            qMap.put("isPublished", q.getIsPublished());
            qMap.put("attemptsCount", qAttempts.size());
            qMap.put("averageScore", Math.round(qAvg * 10.0) / 10.0);
            quizPerformance.add(qMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalQuizzesCreated", teacherQuizzes.size());
        result.put("totalAttempts", totalAttempts);
        result.put("averageScore", Math.round(avgScore * 10.0) / 10.0);
        result.put("passRate", passRate);
        result.put("totalStudentsEngaged", attemptsByStudent.size());
        result.put("studentLeaderboard", studentLeaderboard);
        result.put("strugglingStudents", strugglingStudents);
        result.put("quizPerformance", quizPerformance);

        return result;
    }

    public Map<String, Object> getAdminAnalytics() {
        long totalUsers = userRepository.count();
        List<User> allUsers = userRepository.findAll();
        long totalStudents = allUsers.stream().filter(u -> Role.STUDENT.equals(u.getRole())).count();
        long totalTeachers = allUsers.stream().filter(u -> Role.TEACHER.equals(u.getRole())).count();

        long totalSubjects = subjectRepository.count();
        long totalQuizzes = quizRepository.count();
        long totalMaterials = studyMaterialRepository.count();
        long totalAttempts = quizAttemptRepository.count();

        List<QuizAttempt> allAttempts = quizAttemptRepository.findAll();
        double overallAvgScore = allAttempts.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0.0);
        int totalCorrect = allAttempts.stream().mapToInt(a -> a.getCorrectAnswers() != null ? a.getCorrectAnswers() : 0).sum();
        int totalWrong = allAttempts.stream().mapToInt(a -> a.getWrongAnswers() != null ? a.getWrongAnswers() : 0).sum();
        int totalAnswers = totalCorrect + totalWrong;
        int overallAccuracy = totalAnswers > 0 ? (int) Math.round(((double) totalCorrect / totalAnswers) * 100) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("totalStudents", totalStudents);
        result.put("totalTeachers", totalTeachers);
        result.put("totalSubjects", totalSubjects);
        result.put("totalQuizzes", totalQuizzes);
        result.put("totalMaterials", totalMaterials);
        result.put("totalAttempts", totalAttempts);
        result.put("overallAverageScore", Math.round(overallAvgScore * 10.0) / 10.0);
        result.put("overallAccuracy", overallAccuracy);

        return result;
    }
}
