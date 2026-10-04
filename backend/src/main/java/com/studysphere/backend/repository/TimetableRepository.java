package com.studysphere.backend.repository;

import com.studysphere.backend.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByCourseIdAndSemesterId(Long courseId, Long semesterId);
    List<Timetable> findByTeacherId(Long teacherId);
}
