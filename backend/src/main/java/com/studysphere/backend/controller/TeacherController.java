package com.studysphere.backend.controller;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TimetableRepository timetableRepository;
    private final UserRepository userRepository;
    private final StudyMaterialRepository studyMaterialRepository;

    @GetMapping("/{teacherId}/dashboard")
    public ResponseEntity<?> getDashboardData(@PathVariable Long teacherId) {
        List<Timetable> timetables = timetableRepository.findByTeacherId(teacherId);

        // Calculate assigned subjects
        Set<Map<String, Object>> assignedSubjects = new HashSet<>();
        for (Timetable t : timetables) {
            if (t.getSubject() != null) {
                assignedSubjects.add(Map.of(
                    "id", t.getSubject().getId(),
                    "name", t.getSubject().getName(),
                    "code", t.getSubject().getCode()
                ));
            }
        }

        // Calculate total students across all unique course+semester combinations the teacher teaches
        Set<String> courseSemesterPairs = new HashSet<>();
        long totalStudents = 0;
        for (Timetable t : timetables) {
            if (t.getCourse() != null && t.getSemester() != null) {
                String key = t.getCourse().getId() + "-" + t.getSemester().getId();
                if (courseSemesterPairs.add(key)) {
                    totalStudents += userRepository.countByRoleAndCourseIdAndSemesterId(Role.STUDENT, t.getCourse().getId(), t.getSemester().getId());
                }
            }
        }

        // Find today's classes
        String today = LocalDate.now().getDayOfWeek().name();
        // Convert 'MONDAY' to 'Monday' format
        String todayFormatted = today.substring(0, 1).toUpperCase() + today.substring(1).toLowerCase();
        
        List<Map<String, Object>> todaysClasses = new ArrayList<>();
        for (Timetable t : timetables) {
            if (todayFormatted.equalsIgnoreCase(t.getDayOfWeek())) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());
                map.put("startTime", t.getStartTime());
                map.put("endTime", t.getEndTime());
                map.put("classroom", t.getClassroom());
                if (t.getSubject() != null) {
                    map.put("subject", t.getSubject().getName());
                }
                todaysClasses.add(map);
            }
        }
        
        // Sort today's classes by start time
        todaysClasses.sort((a, b) -> ((String) a.get("startTime")).compareTo((String) b.get("startTime")));

        List<StudyMaterial> materials = studyMaterialRepository.findByTeacherId(teacherId);
        List<String> studyMaterialTitles = materials.stream().map(StudyMaterial::getTitle).collect(Collectors.toList());

        Map<String, Object> dashboardData = new HashMap<>();
        dashboardData.put("assignedSubjects", new ArrayList<>(assignedSubjects));
        dashboardData.put("totalStudents", totalStudents);
        dashboardData.put("todaysClasses", todaysClasses);
        dashboardData.put("pendingTasks", List.of("Grade midterms", "Update syllabus")); // static placeholder
        dashboardData.put("quizzes", new ArrayList<>()); // static placeholder
        dashboardData.put("studyMaterials", studyMaterialTitles);

        return ResponseEntity.ok(dashboardData);
    }
}
