package com.studysphere.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_plan_id")
    private StudyPlan studyPlan;

    private String studyDate; // YYYY-MM-DD
    private String subject;
    private String topic;

    @Column(columnDefinition = "TEXT")
    private String taskDescription;

    private Integer plannedDurationMinutes;
    private Boolean isCompleted;
}

