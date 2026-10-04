package com.studysphere.backend.repository;

import com.studysphere.backend.entity.StudyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyTaskRepository extends JpaRepository<StudyTask, Long> {
    List<StudyTask> findByStudyPlanIdOrderByStudyDateAsc(Long studyPlanId);
    List<StudyTask> findByStudyPlanIdIn(List<Long> studyPlanIds);
    void deleteByStudyPlanId(Long studyPlanId);
}
