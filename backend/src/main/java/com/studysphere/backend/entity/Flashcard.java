package com.studysphere.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_set_id")
    private FlashcardSet flashcardSet;

    @Column(columnDefinition = "TEXT")
    private String front;

    @Column(columnDefinition = "TEXT")
    private String back;

    private String status; // "UNSTUDIED", "KNOWN", "PRACTICE"
    private Integer orderIndex;
}
