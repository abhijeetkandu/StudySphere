package com.studysphere.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String eventDate; // YYYY-MM-DD

    // HOLIDAY, EXAM, ASSIGNMENT, COLLEGE_EVENT, LECTURE, DEADLINE, OTHER
    @Column(nullable = false)
    private String eventType = "COLLEGE_EVENT";

    private String startTime; // HH:mm (optional)
    private String endTime;   // HH:mm (optional)

    private String academicYear; // e.g. "2025-2026"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "semester_id", nullable = true)
    @JsonIgnoreProperties({"course", "subjects"})
    private Semester semester;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = true)
    @JsonIgnoreProperties({"department", "semesters"})
    private Course course;

    private boolean published = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id", nullable = true)
    @JsonIgnoreProperties({"password", "course", "semester", "college"})
    private User createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();
}
