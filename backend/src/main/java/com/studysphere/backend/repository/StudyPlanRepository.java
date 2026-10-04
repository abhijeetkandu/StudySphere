package com.studysphere.backend.repository;

import com.studysphere.backend.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
    List<StudyPlan> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
