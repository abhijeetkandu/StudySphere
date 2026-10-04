package com.studysphere.backend.service;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CalendarEventService {

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    public List<CalendarEvent> getAllEvents() {
        return calendarEventRepository.findAllByOrderByEventDateAscStartTimeAsc();
    }

    public List<CalendarEvent> getPublishedEvents(String academicYear) {
        if (academicYear != null && !academicYear.isBlank()) {
            return calendarEventRepository.findByAcademicYearAndPublishedTrueOrderByEventDateAscStartTimeAsc(academicYear);
        }
        return calendarEventRepository.findByPublishedTrueOrderByEventDateAscStartTimeAsc();
    }

    public List<CalendarEvent> getEventsForStudent(Long studentId, String academicYear) {
        Optional<User> userOpt = userRepository.findById(studentId);
        List<CalendarEvent> allPublished = getPublishedEvents(academicYear);

        if (userOpt.isEmpty()) {
            return allPublished;
        }

        User student = userOpt.get();
        Long studentCourseId = student.getCourse() != null ? student.getCourse().getId() : null;
        Long studentSemesterId = student.getSemester() != null ? student.getSemester().getId() : null;

        return allPublished.stream().filter(event -> {
            // Campus-wide event
            if (event.getCourse() == null && event.getSemester() == null) {
                return true;
            }
            // Course match
            if (event.getCourse() != null && studentCourseId != null && event.getCourse().getId().equals(studentCourseId)) {
                if (event.getSemester() == null || (studentSemesterId != null && event.getSemester().getId().equals(studentSemesterId))) {
                    return true;
                }
            }
            // Semester match
            if (event.getSemester() != null && studentSemesterId != null && event.getSemester().getId().equals(studentSemesterId)) {
                return true;
            }
            return false;
        }).collect(Collectors.toList());
    }

    public List<CalendarEvent> getEventsForTeacher(Long teacherId, String academicYear) {
        List<CalendarEvent> allPublished = getPublishedEvents(academicYear);
        List<CalendarEvent> ownEvents = calendarEventRepository.findByCreatedByIdOrderByEventDateAscStartTimeAsc(teacherId);

        List<CalendarEvent> combined = new ArrayList<>(allPublished);
        for (CalendarEvent e : ownEvents) {
            if (!combined.contains(e)) {
                combined.add(e);
            }
        }
        combined.sort((a, b) -> {
            int cmp = a.getEventDate().compareTo(b.getEventDate());
            if (cmp != 0) return cmp;
            String t1 = a.getStartTime() != null ? a.getStartTime() : "";
            String t2 = b.getStartTime() != null ? b.getStartTime() : "";
            return t1.compareTo(t2);
        });
        return combined;
    }

    public List<CalendarEvent> getUpcomingEvents(Long userId, int limit) {
        String today = LocalDate.now().toString();
        List<CalendarEvent> userEvents;

        if (userId != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                if (u.getRole() == Role.STUDENT) {
                    userEvents = getEventsForStudent(userId, null);
                } else if (u.getRole() == Role.TEACHER) {
                    userEvents = getEventsForTeacher(userId, null);
                } else {
                    userEvents = getAllEvents();
                }
            } else {
                userEvents = calendarEventRepository.findByPublishedTrueAndEventDateGreaterThanEqualOrderByEventDateAscStartTimeAsc(today);
            }
        } else {
            userEvents = calendarEventRepository.findByPublishedTrueAndEventDateGreaterThanEqualOrderByEventDateAscStartTimeAsc(today);
        }

        return userEvents.stream()
                .filter(e -> e.isPublished() && e.getEventDate() != null && e.getEventDate().compareTo(today) >= 0)
                .limit(limit > 0 ? limit : 5)
                .collect(Collectors.toList());
    }

    @Transactional
    public CalendarEvent createEvent(CalendarEvent event, Long createdById, Long courseId, Long semesterId) {
        String today = LocalDate.now().toString();
        if (event.getEventDate() != null && event.getEventDate().trim().compareTo(today) < 0) {
            throw new IllegalArgumentException("Event date cannot be in the past. Please select today or a future date.");
        }

        if (createdById != null) {
            User creator = userRepository.findById(createdById).orElse(null);
            event.setCreatedBy(creator);
        }

        if (courseId != null) {
            Course course = courseRepository.findById(courseId).orElse(null);
            event.setCourse(course);
        } else {
            event.setCourse(null);
        }

        if (semesterId != null) {
            Semester semester = semesterRepository.findById(semesterId).orElse(null);
            event.setSemester(semester);
        } else {
            event.setSemester(null);
        }

        if (event.getEventType() == null || event.getEventType().isBlank()) {
            event.setEventType("COLLEGE_EVENT");
        }

        event.setCreatedAt(LocalDateTime.now());
        return calendarEventRepository.save(event);
    }

    @Transactional
    public CalendarEvent updateEvent(Long id, CalendarEvent updatedData, Long courseId, Long semesterId) {
        CalendarEvent existing = calendarEventRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        String today = LocalDate.now().toString();
        if (updatedData.getEventDate() != null && updatedData.getEventDate().trim().compareTo(today) < 0) {
            throw new IllegalArgumentException("Event date cannot be in the past. Please select today or a future date.");
        }

        existing.setTitle(updatedData.getTitle());
        existing.setDescription(updatedData.getDescription());
        existing.setEventDate(updatedData.getEventDate());
        existing.setEventType(updatedData.getEventType() != null ? updatedData.getEventType() : "COLLEGE_EVENT");
        existing.setStartTime(updatedData.getStartTime());
        existing.setEndTime(updatedData.getEndTime());
        existing.setAcademicYear(updatedData.getAcademicYear());
        existing.setPublished(updatedData.isPublished());

        if (courseId != null) {
            Course course = courseRepository.findById(courseId).orElse(null);
            existing.setCourse(course);
        } else {
            existing.setCourse(null);
        }

        if (semesterId != null) {
            Semester semester = semesterRepository.findById(semesterId).orElse(null);
            existing.setSemester(semester);
        } else {
            existing.setSemester(null);
        }

        return calendarEventRepository.save(existing);
    }

    @Transactional
    public CalendarEvent togglePublish(Long id) {
        CalendarEvent existing = calendarEventRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        existing.setPublished(!existing.isPublished());
        return calendarEventRepository.save(existing);
    }

    @Transactional
    public boolean deleteEvent(Long id) {
        if (calendarEventRepository.existsById(id)) {
            calendarEventRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
