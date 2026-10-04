package com.studysphere.backend.service;

import com.studysphere.backend.entity.Announcement;
import com.studysphere.backend.entity.Role;
import com.studysphere.backend.entity.Subject;
import com.studysphere.backend.entity.User;
import com.studysphere.backend.repository.AnnouncementRepository;
import com.studysphere.backend.repository.SubjectRepository;
import com.studysphere.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Announcement> getPublishedAnnouncements() {
        return announcementRepository.findByPublishedTrueOrderByCreatedAtDesc();
    }

    public List<Announcement> getAnnouncementsByAuthor(Long authorId) {
        return announcementRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
    }

    public List<Announcement> getAnnouncementsForUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return announcementRepository.findByPublishedTrueOrderByCreatedAtDesc();
        }

        User user = userOpt.get();
        if (user.getRole() == Role.ADMIN) {
            return announcementRepository.findAllByOrderByCreatedAtDesc();
        }

        if (user.getRole() == Role.TEACHER) {
            // All announcements for ALL or TEACHERS, or authored by this teacher
            List<Announcement> list = announcementRepository.findByPublishedTrueAndTargetAudienceInOrderByCreatedAtDesc(
                    Arrays.asList("ALL", "TEACHERS")
            );
            List<Announcement> own = announcementRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
            for (Announcement a : own) {
                if (!list.contains(a)) {
                    list.add(a);
                }
            }
            list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            return list;
        }

        // STUDENT
        List<Announcement> generalList = announcementRepository.findByPublishedTrueAndTargetAudienceInOrderByCreatedAtDesc(
                Arrays.asList("ALL", "STUDENTS")
        );

        // Filter: if announcement has a subject, ensure student's semester has that subject (or subject is null)
        Long studentSemesterId = (user.getSemester() != null) ? user.getSemester().getId() : null;

        return generalList.stream().filter(a -> {
            if (a.getSubject() == null) {
                return true;
            }
            if (studentSemesterId != null && a.getSubject().getSemester() != null) {
                return a.getSubject().getSemester().getId().equals(studentSemesterId);
            }
            return true;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Announcement createAnnouncement(Announcement announcement, Long authorId, Long subjectId) {
        User author = userRepository.findById(authorId).orElse(null);
        if (author == null) {
            throw new RuntimeException("Author user not found with id " + authorId);
        }

        announcement.setAuthor(author);
        if (subjectId != null) {
            Subject subject = subjectRepository.findById(subjectId).orElse(null);
            announcement.setSubject(subject);
        } else {
            announcement.setSubject(null);
        }

        if (announcement.getTargetAudience() == null || announcement.getTargetAudience().isBlank()) {
            announcement.setTargetAudience("ALL");
        }

        announcement.setCreatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    @Transactional
    public Announcement updateAnnouncement(Long id, Announcement updatedData, Long subjectId) {
        Announcement existing = announcementRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        existing.setTitle(updatedData.getTitle());
        existing.setMessage(updatedData.getMessage());
        existing.setTargetAudience(updatedData.getTargetAudience() != null ? updatedData.getTargetAudience() : "ALL");

        if (subjectId != null) {
            Subject subject = subjectRepository.findById(subjectId).orElse(null);
            existing.setSubject(subject);
        } else {
            existing.setSubject(null);
        }

        existing.setPublished(updatedData.isPublished());
        return announcementRepository.save(existing);
    }

    @Transactional
    public Announcement togglePublish(Long id) {
        Announcement existing = announcementRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        existing.setPublished(!existing.isPublished());
        return announcementRepository.save(existing);
    }

    @Transactional
    public boolean deleteAnnouncement(Long id) {
        if (announcementRepository.existsById(id)) {
            announcementRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
