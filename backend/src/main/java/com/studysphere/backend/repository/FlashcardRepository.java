package com.studysphere.backend.repository;

import com.studysphere.backend.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByFlashcardSetIdOrderByOrderIndexAsc(Long flashcardSetId);
    void deleteByFlashcardSetId(Long flashcardSetId);
}
