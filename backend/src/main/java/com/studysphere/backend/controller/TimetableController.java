package com.studysphere.backend.controller;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/timetables")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableRepository timetableRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    @GetMapping("/course/{courseId}/semester/{semesterId}")
    public ResponseEntity<?> getTimetables(@PathVariable Long courseId, @PathVariable Long semesterId) {
        List<Timetable> timetables = timetableRepository.findByCourseIdAndSemesterId(courseId, semesterId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Timetable t : timetables) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("academicYear", t.getAcademicYear());
            map.put("dayOfWeek", t.getDayOfWeek());
            map.put("startTime", t.getStartTime());
            map.put("endTime", t.getEndTime());
            map.put("classroom", t.getClassroom());
            
            if (t.getSubject() != null) {
                map.put("subject", Map.of("id", t.getSubject().getId(), "name", t.getSubject().getName()));
            }
            if (t.getTeacher() != null) {
                map.put("teacher", Map.of("id", t.getTeacher().getId(), "name", t.getTeacher().getName()));
            }
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> addTimetable(@RequestBody Map<String, Object> payload) {
        Timetable t = new Timetable();
        t.setAcademicYear((String) payload.get("academicYear"));
        t.setDayOfWeek((String) payload.get("dayOfWeek"));
        t.setStartTime((String) payload.get("startTime"));
        t.setEndTime((String) payload.get("endTime"));
        t.setClassroom((String) payload.get("classroom"));

        if (payload.get("courseId") != null) {
            Course c = courseRepository.findById(Long.valueOf(payload.get("courseId").toString())).orElse(null);
            t.setCourse(c);
        }
        if (payload.get("semesterId") != null) {
            Semester s = semesterRepository.findById(Long.valueOf(payload.get("semesterId").toString())).orElse(null);
            t.setSemester(s);
        }
        if (payload.get("subjectId") != null) {
            Subject subj = subjectRepository.findById(Long.valueOf(payload.get("subjectId").toString())).orElse(null);
            t.setSubject(subj);
        }
        if (payload.get("teacherId") != null) {
            User teacher = userRepository.findById(Long.valueOf(payload.get("teacherId").toString())).orElse(null);
            t.setTeacher(teacher);
        }

        Timetable saved = timetableRepository.save(t);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Added"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTimetable(@PathVariable Long id) {
        timetableRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
