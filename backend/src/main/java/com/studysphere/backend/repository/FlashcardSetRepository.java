package com.studysphere.backend.repository;

import com.studysphere.backend.entity.FlashcardSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardSetRepository extends JpaRepository<FlashcardSet, Long> {
    List<FlashcardSet> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<FlashcardSet> findBySubjectId(Long subjectId);
    List<FlashcardSet> findByStudentIdAndSubjectId(Long studentId, Long subjectId);
}
