package com.studysphere.backend.repository;

import com.studysphere.backend.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findBySubjectId(Long subjectId);
    List<Quiz> findBySubjectIdAndIsPublishedTrue(Long subjectId);
    List<Quiz> findByTeacherId(Long teacherId);
}
