package com.studysphere.backend.repository;

import com.studysphere.backend.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    List<Announcement> findByPublishedTrueOrderByCreatedAtDesc();

    List<Announcement> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    List<Announcement> findByPublishedTrueAndTargetAudienceInOrderByCreatedAtDesc(List<String> audiences);
}
