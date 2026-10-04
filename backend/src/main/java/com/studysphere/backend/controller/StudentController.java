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
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final StudyMaterialRepository studyMaterialRepository;

    @GetMapping("/{studentId}/dashboard")
    public ResponseEntity<?> getDashboardData(@PathVariable Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

        Map<String, Object> dashboardData = new HashMap<>();
        
        // Profile Information
        Map<String, Object> profile = new HashMap<>();
        profile.put("name", student.getName());
        profile.put("email", student.getEmail());
        if (student.getCollege() != null) profile.put("college", student.getCollege().getName());
        
        Long courseId = null;
        Long semesterId = null;

        if (student.getCourse() != null) {
            profile.put("course", student.getCourse().getName());
            courseId = student.getCourse().getId();
        }
        if (student.getSemester() != null) {
            profile.put("semester", student.getSemester().getNumber());
            semesterId = student.getSemester().getId();
        }
        dashboardData.put("profile", profile);

        // Fetch subjects
        List<Subject> enrolledSubjectsList = new ArrayList<>();
        if (semesterId != null) {
            enrolledSubjectsList = subjectRepository.findBySemesterId(semesterId);
        }
        
        List<Map<String, Object>> enrolledSubjects = new ArrayList<>();
        for (Subject s : enrolledSubjectsList) {
            enrolledSubjects.add(Map.of("id", s.getId(), "name", s.getName(), "code", s.getCode()));
        }
        dashboardData.put("enrolledSubjects", enrolledSubjects);

        // Fetch Timetable & Academic Year
        List<Map<String, Object>> todaysClasses = new ArrayList<>();
        String academicYear = "Current Year";
        
        if (courseId != null && semesterId != null) {
            List<Timetable> timetables = timetableRepository.findByCourseIdAndSemesterId(courseId, semesterId);
            if (!timetables.isEmpty() && timetables.get(0).getAcademicYear() != null) {
                academicYear = timetables.get(0).getAcademicYear();
            }

            String today = LocalDate.now().getDayOfWeek().name();
            String todayFormatted = today.substring(0, 1).toUpperCase() + today.substring(1).toLowerCase();

            for (Timetable t : timetables) {
                if (todayFormatted.equalsIgnoreCase(t.getDayOfWeek())) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("startTime", t.getStartTime());
                    map.put("endTime", t.getEndTime());
                    map.put("classroom", t.getClassroom());
                    if (t.getSubject() != null) map.put("subject", t.getSubject().getName());
                    if (t.getTeacher() != null) map.put("teacher", t.getTeacher().getName());
                    todaysClasses.add(map);
                }
            }
        }
        todaysClasses.sort((a, b) -> ((String) a.get("startTime")).compareTo((String) b.get("startTime")));
        dashboardData.put("todaysClasses", todaysClasses);
        dashboardData.put("academicYear", academicYear);

        // Fetch Recent Study Materials
        List<Map<String, Object>> recentMaterials = new ArrayList<>();
        if (!enrolledSubjectsList.isEmpty()) {
            List<Long> subjectIds = enrolledSubjectsList.stream().map(Subject::getId).collect(Collectors.toList());
            List<StudyMaterial> materials = studyMaterialRepository.findBySubjectIdIn(subjectIds);
            
            // Sort by ID descending (mocking recency without complex date parsing)
            materials.sort((a, b) -> b.getId().compareTo(a.getId()));
            
            int count = 0;
            for (StudyMaterial m : materials) {
                if (count++ >= 5) break; // Limit to top 5 recent
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("title", m.getTitle());
                map.put("materialType", m.getMaterialType());
                map.put("uploadedDate", m.getUploadedDate() != null ? m.getUploadedDate().toString() : "");
                if (m.getSubject() != null) map.put("subject", m.getSubject().getName());
                recentMaterials.add(map);
            }
        }
        dashboardData.put("recentMaterials", recentMaterials);

        return ResponseEntity.ok(dashboardData);
    }
}
