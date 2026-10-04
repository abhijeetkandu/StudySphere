package com.studysphere.backend.repository;

import com.studysphere.backend.entity.StudyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {
    List<StudyMaterial> findBySubjectId(Long subjectId);
    List<StudyMaterial> findByTeacherId(Long teacherId);
    List<StudyMaterial> findBySubjectIdIn(List<Long> subjectIds);
}
