package com.studysphere.backend.service;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StudyPlanService {

    private final StudyPlanRepository studyPlanRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;
    private final GeminiService geminiService;

    public Map<String, Object> generatePlan(Long studentId, Map<String, Object> request) {
        String examDate = (String) request.get("examDate");
        String today = LocalDate.now().toString();
        if (examDate != null && !examDate.isBlank() && examDate.trim().compareTo(today) < 0) {
            throw new IllegalArgumentException("Target exam date cannot be in the past. Please select today or a future date.");
        }
        Double hoursPerDay = 3.0;
        if (request.get("hoursPerDay") != null) {
            hoursPerDay = Double.valueOf(request.get("hoursPerDay").toString());
        } else if (request.get("dailyAvailableHours") != null) {
            hoursPerDay = Double.valueOf(request.get("dailyAvailableHours").toString());
        }

        String preferredTime = "Morning (6 AM - 12 PM)";
        if (request.get("preferredTime") != null && !request.get("preferredTime").toString().isBlank()) {
            preferredTime = request.get("preferredTime").toString();
        } else if (request.get("preferredStudyTime") != null && !request.get("preferredStudyTime").toString().isBlank()) {
            preferredTime = request.get("preferredStudyTime").toString();
        }

        String title = (String) request.getOrDefault("title", "My AI Study Plan");
        String customTopicsPrompt = (String) request.get("customTopicsPrompt");

        List<Map<String, Object>> subjectTopicsList = new ArrayList<>();
        Object subjectsObj = request.get("subjects");

        if (subjectsObj instanceof List<?> && !((List<?>) subjectsObj).isEmpty()) {
            for (Object item : (List<?>) subjectsObj) {
                if (item instanceof Map<?, ?>) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> subMap = (Map<String, Object>) item;
                    subjectTopicsList.add(subMap);
                } else if (item instanceof String) {
                    String subNameStr = (String) item;
                    List<String> topicNames = new ArrayList<>();
                    // Try to find subject topics from DB
                    List<Subject> foundSubs = subjectRepository.findAll().stream()
                            .filter(s -> s.getName().equalsIgnoreCase(subNameStr))
                            .toList();
                    if (!foundSubs.isEmpty()) {
                        Subject s = foundSubs.get(0);
                        List<Chapter> chapters = chapterRepository.findBySubjectId(s.getId());
                        for (Chapter chap : chapters) {
                            List<Topic> topics = topicRepository.findByChapterId(chap.getId());
                            for (Topic top : topics) {
                                topicNames.add(top.getTitle());
                            }
                        }
                    }
                    if (topicNames.isEmpty() && customTopicsPrompt != null && !customTopicsPrompt.isBlank()) {
                        topicNames.add(customTopicsPrompt);
                    }
                    if (topicNames.isEmpty()) {
                        topicNames.add("Core Concepts & Practice");
                    }
                    Map<String, Object> subMap = new HashMap<>();
                    subMap.put("subject", subNameStr);
                    subMap.put("topics", topicNames);
                    subjectTopicsList.add(subMap);
                }
            }
        }

        // If subjects list is empty and studentId is present, auto-discover enrolled subjects & topics
        if (subjectTopicsList.isEmpty() && studentId != null) {
            Optional<User> studentOpt = userRepository.findById(studentId);
            if (studentOpt.isPresent() && studentOpt.get().getSemester() != null) {
                List<Subject> subjects = subjectRepository.findBySemesterId(studentOpt.get().getSemester().getId());
                for (Subject sub : subjects) {
                    List<Chapter> chapters = chapterRepository.findBySubjectId(sub.getId());
                    List<String> topicNames = new ArrayList<>();
                    for (Chapter chap : chapters) {
                        List<Topic> topics = topicRepository.findByChapterId(chap.getId());
                        for (Topic top : topics) {
                            topicNames.add(top.getTitle());
                        }
                    }
                    Map<String, Object> subMap = new HashMap<>();
                    subMap.put("subject", sub.getName());
                    subMap.put("topics", topicNames);
                    subjectTopicsList.add(subMap);
                }
            }
        }

        List<String> prioritySubjects = new ArrayList<>();
        Object priObj = request.get("prioritySubjects");
        if (priObj instanceof List<?>) {
            for (Object p : (List<?>) priObj) {
                if (p != null) prioritySubjects.add(p.toString());
            }
        } else if (priObj instanceof String) {
            String priStr = (String) priObj;
            if (!priStr.isBlank()) {
                prioritySubjects.addAll(Arrays.asList(priStr.split(",\\s*")));
            }
        }

        Map<String, Object> generated = geminiService.generateStudyPlan(examDate, hoursPerDay, preferredTime, subjectTopicsList, prioritySubjects, title);
        
        generated.put("studentId", studentId);
        generated.put("title", title);
        generated.put("examDate", examDate);
        generated.put("hoursPerDay", hoursPerDay);
        generated.put("dailyAvailableHours", hoursPerDay);
        generated.put("preferredTime", preferredTime);
        generated.put("preferredStudyTime", preferredTime);
        generated.put("prioritySubjects", String.join(", ", prioritySubjects));
        return generated;
    }

    @Transactional
    public Map<String, Object> savePlan(Long studentId, Map<String, Object> planData) {
        Long resolvedStudentId = studentId;
        if (resolvedStudentId == null && planData.get("studentId") != null && !planData.get("studentId").toString().isBlank()) {
            resolvedStudentId = Long.valueOf(planData.get("studentId").toString());
        }
        if (resolvedStudentId == null) {
            throw new IllegalArgumentException("Student ID must be provided");
        }
        final Long finalStudentId = resolvedStudentId;
        User student = userRepository.findById(finalStudentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + finalStudentId));

        String title = (String) planData.getOrDefault("title", "My AI Study Plan");
        String examDate = (String) planData.get("examDate");
        String today = LocalDate.now().toString();
        if (examDate != null && !examDate.isBlank() && examDate.trim().compareTo(today) < 0) {
            throw new IllegalArgumentException("Target exam date cannot be in the past. Please select today or a future date.");
        }
        Double hoursPerDay = 3.0;
        if (planData.get("hoursPerDay") != null) {
            hoursPerDay = Double.valueOf(planData.get("hoursPerDay").toString());
        } else if (planData.get("dailyAvailableHours") != null) {
            hoursPerDay = Double.valueOf(planData.get("dailyAvailableHours").toString());
        }

        String preferredTime = (String) planData.getOrDefault("preferredTime", planData.get("preferredStudyTime"));
        String prioritySubjects = (String) planData.get("prioritySubjects");
        String summary = (String) planData.get("summary");

        StudyPlan plan = new StudyPlan();
        plan.setStudent(student);
        plan.setTitle(title);
        plan.setExamDate(examDate);
        plan.setHoursPerDay(hoursPerDay);
        plan.setPreferredTime(preferredTime);
        plan.setPrioritySubjects(prioritySubjects);
        plan.setSummary(summary);
        plan.setCreatedAt(LocalDateTime.now());

        StudyPlan savedPlan = studyPlanRepository.save(plan);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> tasksData = (List<Map<String, Object>>) planData.get("tasks");
        List<StudyTask> savedTasks = new ArrayList<>();

        if (tasksData != null) {
            for (Map<String, Object> t : tasksData) {
                StudyTask task = new StudyTask();
                task.setStudyPlan(savedPlan);
                task.setStudyDate((String) t.getOrDefault("studyDate", ""));
                task.setSubject((String) t.getOrDefault("subject", "General"));
                task.setTopic((String) t.getOrDefault("topic", "General Topic"));
                task.setTaskDescription((String) t.getOrDefault("taskDescription", "Study and review"));
                
                Object durationObj = t.get("plannedDurationMinutes");
                int duration = 60;
                if (durationObj != null) {
                    try {
                        duration = Integer.parseInt(durationObj.toString());
                    } catch (NumberFormatException ignored) {}
                }
                task.setPlannedDurationMinutes(duration);

                Object isDoneObj = t.get("isCompleted");
                boolean isDone = false;
                if (isDoneObj instanceof Boolean) {
                    isDone = (Boolean) isDoneObj;
                } else if (isDoneObj != null) {
                    isDone = Boolean.parseBoolean(isDoneObj.toString());
                }
                task.setIsCompleted(isDone);

                savedTasks.add(studyTaskRepository.save(task));
            }
        }

        return formatPlanDetails(savedPlan, savedTasks);
    }

    public List<Map<String, Object>> getStudentPlans(Long studentId) {
        List<StudyPlan> plans = studyPlanRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (StudyPlan plan : plans) {
            List<StudyTask> tasks = studyTaskRepository.findByStudyPlanIdOrderByStudyDateAsc(plan.getId());
            int totalTasks = tasks.size();
            long completedTasks = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).count();
            int progressPercent = totalTasks > 0 ? (int) Math.round(((double) completedTasks / totalTasks) * 100) : 0;
            
            int totalMinutes = tasks.stream().mapToInt(t -> t.getPlannedDurationMinutes() != null ? t.getPlannedDurationMinutes() : 0).sum();
            int completedMinutes = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).mapToInt(t -> t.getPlannedDurationMinutes() != null ? t.getPlannedDurationMinutes() : 0).sum();

            Map<String, Object> map = new HashMap<>();
            map.put("id", plan.getId());
            map.put("title", plan.getTitle());
            map.put("examDate", plan.getExamDate());
            map.put("hoursPerDay", plan.getHoursPerDay());
            map.put("preferredTime", plan.getPreferredTime());
            map.put("prioritySubjects", plan.getPrioritySubjects());
            map.put("summary", plan.getSummary());
            map.put("createdAt", plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : "");
            map.put("totalTasks", totalTasks);
            map.put("completedTasks", completedTasks);
            map.put("progressPercent", progressPercent);
            map.put("totalMinutes", totalMinutes);
            map.put("completedMinutes", completedMinutes);
            result.add(map);
        }

        return result;
    }

    public Map<String, Object> getPlanDetails(Long planId) {
        StudyPlan plan = studyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Study Plan not found with ID: " + planId));
        List<StudyTask> tasks = studyTaskRepository.findByStudyPlanIdOrderByStudyDateAsc(planId);
        return formatPlanDetails(plan, tasks);
    }

    @Transactional
    public Map<String, Object> updatePlan(Long planId, Map<String, Object> updateData) {
        StudyPlan plan = studyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Study Plan not found with ID: " + planId));

        if (updateData.containsKey("title")) plan.setTitle((String) updateData.get("title"));
        if (updateData.containsKey("examDate")) plan.setExamDate((String) updateData.get("examDate"));
        if (updateData.containsKey("hoursPerDay") && updateData.get("hoursPerDay") != null) {
            plan.setHoursPerDay(Double.valueOf(updateData.get("hoursPerDay").toString()));
        }
        if (updateData.containsKey("preferredTime")) plan.setPreferredTime((String) updateData.get("preferredTime"));
        if (updateData.containsKey("prioritySubjects")) plan.setPrioritySubjects((String) updateData.get("prioritySubjects"));
        if (updateData.containsKey("summary")) plan.setSummary((String) updateData.get("summary"));

        StudyPlan saved = studyPlanRepository.save(plan);
        List<StudyTask> tasks = studyTaskRepository.findByStudyPlanIdOrderByStudyDateAsc(planId);
        return formatPlanDetails(saved, tasks);
    }

    @Transactional
    public void deletePlan(Long planId) {
        studyTaskRepository.deleteByStudyPlanId(planId);
        studyPlanRepository.deleteById(planId);
    }

    @Transactional
    public Map<String, Object> toggleTaskStatus(Long taskId) {
        StudyTask task = studyTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Study Task not found with ID: " + taskId));

        boolean newStatus = !Boolean.TRUE.equals(task.getIsCompleted());
        task.setIsCompleted(newStatus);
        StudyTask saved = studyTaskRepository.save(task);

        return formatTask(saved);
    }

    @Transactional
    public Map<String, Object> updateTask(Long taskId, Map<String, Object> taskData) {
        StudyTask task = studyTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Study Task not found with ID: " + taskId));

        if (taskData.containsKey("studyDate")) task.setStudyDate((String) taskData.get("studyDate"));
        if (taskData.containsKey("subject")) task.setSubject((String) taskData.get("subject"));
        if (taskData.containsKey("topic")) task.setTopic((String) taskData.get("topic"));
        if (taskData.containsKey("taskDescription")) task.setTaskDescription((String) taskData.get("taskDescription"));
        if (taskData.containsKey("plannedDurationMinutes") && taskData.get("plannedDurationMinutes") != null) {
            task.setPlannedDurationMinutes(Integer.parseInt(taskData.get("plannedDurationMinutes").toString()));
        }
        if (taskData.containsKey("isCompleted") && taskData.get("isCompleted") != null) {
            task.setIsCompleted(Boolean.parseBoolean(taskData.get("isCompleted").toString()));
        }

        StudyTask saved = studyTaskRepository.save(task);
        return formatTask(saved);
    }

    @Transactional
    public Map<String, Object> addTask(Long planId, Map<String, Object> taskData) {
        StudyPlan plan = studyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Study Plan not found with ID: " + planId));

        String studyDate = (String) taskData.getOrDefault("studyDate", java.time.LocalDate.now().toString());
        String today = LocalDate.now().toString();
        if (studyDate != null && !studyDate.isBlank() && studyDate.trim().compareTo(today) < 0) {
            throw new IllegalArgumentException("Study task date cannot be in the past. Please select today or a future date.");
        }

        StudyTask task = new StudyTask();
        task.setStudyPlan(plan);
        task.setStudyDate(studyDate);
        task.setSubject((String) taskData.getOrDefault("subject", "General"));
        task.setTopic((String) taskData.getOrDefault("topic", "General Topic"));
        task.setTaskDescription((String) taskData.getOrDefault("taskDescription", "Study & Practice"));
        
        int duration = 60;
        if (taskData.get("plannedDurationMinutes") != null) {
            try {
                duration = Integer.parseInt(taskData.get("plannedDurationMinutes").toString());
            } catch (Exception ignored) {}
        }
        task.setPlannedDurationMinutes(duration);
        task.setIsCompleted(false);

        StudyTask saved = studyTaskRepository.save(task);
        return formatTask(saved);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        studyTaskRepository.deleteById(taskId);
    }

    private Map<String, Object> formatPlanDetails(StudyPlan plan, List<StudyTask> tasks) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", plan.getId());
        result.put("title", plan.getTitle());
        result.put("examDate", plan.getExamDate());
        result.put("hoursPerDay", plan.getHoursPerDay());
        result.put("preferredTime", plan.getPreferredTime());
        result.put("prioritySubjects", plan.getPrioritySubjects());
        result.put("summary", plan.getSummary());
        result.put("createdAt", plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : "");

        int totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).count();
        int progressPercent = totalTasks > 0 ? (int) Math.round(((double) completedTasks / totalTasks) * 100) : 0;
        int totalMinutes = tasks.stream().mapToInt(t -> t.getPlannedDurationMinutes() != null ? t.getPlannedDurationMinutes() : 0).sum();
        int completedMinutes = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).mapToInt(t -> t.getPlannedDurationMinutes() != null ? t.getPlannedDurationMinutes() : 0).sum();

        result.put("totalTasks", totalTasks);
        result.put("completedTasks", completedTasks);
        result.put("progressPercent", progressPercent);
        result.put("totalMinutes", totalMinutes);
        result.put("completedMinutes", completedMinutes);

        List<Map<String, Object>> formattedTasks = new ArrayList<>();
        for (StudyTask t : tasks) {
            formattedTasks.add(formatTask(t));
        }
        result.put("tasks", formattedTasks);

        return result;
    }

    private Map<String, Object> formatTask(StudyTask t) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", t.getId());
        map.put("studyDate", t.getStudyDate());
        map.put("subject", t.getSubject());
        map.put("topic", t.getTopic());
        map.put("taskDescription", t.getTaskDescription());
        map.put("plannedDurationMinutes", t.getPlannedDurationMinutes());
        map.put("isCompleted", Boolean.TRUE.equals(t.getIsCompleted()));
        if (t.getStudyPlan() != null) {
            map.put("studyPlanId", t.getStudyPlan().getId());
        }
        return map;
    }
}
