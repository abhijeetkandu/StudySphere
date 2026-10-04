package com.studysphere.backend.controller;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class StudyMaterialController {

    private final StudyMaterialRepository studyMaterialRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<?> getMaterialsForSubject(@PathVariable Long subjectId) {
        List<StudyMaterial> materials = studyMaterialRepository.findBySubjectId(subjectId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (StudyMaterial m : materials) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("title", m.getTitle());
            map.put("description", m.getDescription());
            map.put("materialType", m.getMaterialType());
            map.put("url", m.getUrl());
            map.put("uploadedDate", m.getUploadedDate() != null ? m.getUploadedDate().toString() : null);
            if (m.getTeacher() != null) {
                map.put("teacher", m.getTeacher().getName());
            }
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> addMaterial(@RequestBody Map<String, Object> payload) {
        StudyMaterial m = new StudyMaterial();
        m.setTitle((String) payload.get("title"));
        m.setDescription((String) payload.get("description"));
        m.setMaterialType((String) payload.get("materialType"));
        m.setUrl((String) payload.get("url"));
        m.setUploadedDate(LocalDate.now());

        if (payload.get("subjectId") != null) {
            Subject s = subjectRepository.findById(Long.valueOf(payload.get("subjectId").toString())).orElse(null);
            m.setSubject(s);
        }
        if (payload.get("teacherId") != null) {
            User t = userRepository.findById(Long.valueOf(payload.get("teacherId").toString())).orElse(null);
            m.setTeacher(t);
        }

        StudyMaterial saved = studyMaterialRepository.save(m);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Added"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        studyMaterialRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
