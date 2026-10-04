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
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    @JsonIgnoreProperties({"password", "course", "semester", "college"})
    private User author;

    // "ALL", "STUDENTS", "TEACHERS"
    @Column(nullable = false)
    private String targetAudience = "ALL";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = true)
    @JsonIgnoreProperties({"semester", "teacher"})
    private Subject subject;

    private boolean published = true;

    private LocalDateTime createdAt = LocalDateTime.now();
}
