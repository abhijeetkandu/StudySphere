package com.studysphere.backend.repository;

import com.studysphere.backend.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByStudentIdOrderByStartedAtDesc(Long studentId);
}
