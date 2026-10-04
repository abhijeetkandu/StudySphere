package com.studysphere.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String location;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "college", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Department> departments;
}
