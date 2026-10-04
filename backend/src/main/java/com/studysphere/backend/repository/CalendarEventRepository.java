package com.studysphere.backend.repository;

import com.studysphere.backend.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findAllByOrderByEventDateAscStartTimeAsc();

    List<CalendarEvent> findByPublishedTrueOrderByEventDateAscStartTimeAsc();

    List<CalendarEvent> findByAcademicYearAndPublishedTrueOrderByEventDateAscStartTimeAsc(String academicYear);

    List<CalendarEvent> findByCreatedByIdOrderByEventDateAscStartTimeAsc(Long createdById);

    List<CalendarEvent> findByPublishedTrueAndEventDateGreaterThanEqualOrderByEventDateAscStartTimeAsc(String date);
}
