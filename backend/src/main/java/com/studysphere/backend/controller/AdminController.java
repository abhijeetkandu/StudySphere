package com.studysphere.backend.controller;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.mindrot.jbcrypt.BCrypt;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CollegeRepository collegeRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    private static final String PASSWORD_PATTERN = 
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$";
    private static final Pattern passwordPattern = Pattern.compile(PASSWORD_PATTERN);

    // --- Colleges ---
    @GetMapping("/colleges")
    public List<College> getColleges() { return collegeRepository.findAll(); }

    @PostMapping("/colleges")
    public College createCollege(@RequestBody College college) { return collegeRepository.save(college); }

    @PutMapping("/colleges/{id}")
    public College updateCollege(@PathVariable Long id, @RequestBody College updated) {
        return collegeRepository.findById(id).map(college -> {
            college.setName(updated.getName());
            college.setLocation(updated.getLocation());
            return collegeRepository.save(college);
        }).orElseThrow(() -> new RuntimeException("College not found"));
    }

    @DeleteMapping("/colleges/{id}")
    public ResponseEntity<?> deleteCollege(@PathVariable Long id) {
        collegeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // --- Departments ---
    @GetMapping("/departments")
    public List<Department> getDepartments() { return departmentRepository.findAll(); }

    @PostMapping("/departments")
    public Department createDepartment(@RequestBody Department department) { 
        // Need to ensure the college is fetched/set properly if passed just as an ID in JSON
        if (department.getCollege() != null && department.getCollege().getId() != null) {
            department.setCollege(collegeRepository.findById(department.getCollege().getId()).orElse(null));
        }
        return departmentRepository.save(department); 
    }

    @PutMapping("/departments/{id}")
    public Department updateDepartment(@PathVariable Long id, @RequestBody Department updated) {
        return departmentRepository.findById(id).map(dept -> {
            dept.setName(updated.getName());
            if (updated.getCollege() != null && updated.getCollege().getId() != null) {
                dept.setCollege(collegeRepository.findById(updated.getCollege().getId()).orElse(null));
            }
            return departmentRepository.save(dept);
        }).orElseThrow(() -> new RuntimeException("Department not found"));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        departmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // --- Courses ---
    @GetMapping("/courses")
    public List<Course> getCourses() { return courseRepository.findAll(); }

    @PostMapping("/courses")
    public Course createCourse(@RequestBody Course course) { 
        if (course.getDepartment() != null && course.getDepartment().getId() != null) {
            course.setDepartment(departmentRepository.findById(course.getDepartment().getId()).orElse(null));
        }
        return courseRepository.save(course); 
    }

    @PutMapping("/courses/{id}")
    public Course updateCourse(@PathVariable Long id, @RequestBody Course updated) {
        return courseRepository.findById(id).map(course -> {
            course.setName(updated.getName());
            course.setDuration(updated.getDuration());
            if (updated.getDepartment() != null && updated.getDepartment().getId() != null) {
                course.setDepartment(departmentRepository.findById(updated.getDepartment().getId()).orElse(null));
            }
            return courseRepository.save(course);
        }).orElseThrow(() -> new RuntimeException("Course not found"));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // --- Semesters ---
    @GetMapping("/semesters")
    public List<Semester> getSemesters() { return semesterRepository.findAll(); }

    @PostMapping("/semesters")
    public Semester createSemester(@RequestBody Semester semester) {
        if (semester.getCourse() != null && semester.getCourse().getId() != null) {
            semester.setCourse(courseRepository.findById(semester.getCourse().getId()).orElse(null));
        }
        return semesterRepository.save(semester);
    }

    @PutMapping("/semesters/{id}")
    public Semester updateSemester(@PathVariable Long id, @RequestBody Semester updated) {
        return semesterRepository.findById(id).map(semester -> {
            semester.setNumber(updated.getNumber());
            if (updated.getCourse() != null && updated.getCourse().getId() != null) {
                semester.setCourse(courseRepository.findById(updated.getCourse().getId()).orElse(null));
            }
            return semesterRepository.save(semester);
        }).orElseThrow(() -> new RuntimeException("Semester not found"));
    }

    @DeleteMapping("/semesters/{id}")
    public ResponseEntity<?> deleteSemester(@PathVariable Long id) {
        semesterRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // --- Subjects ---
    @GetMapping("/subjects")
    public List<Subject> getSubjects() { return subjectRepository.findAll(); }

    @PostMapping("/subjects")
    public Subject createSubject(@RequestBody Subject subject) {
        if (subject.getSemester() != null && subject.getSemester().getId() != null) {
            subject.setSemester(semesterRepository.findById(subject.getSemester().getId()).orElse(null));
        }
        return subjectRepository.save(subject);
    }

    @PutMapping("/subjects/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject updated) {
        return subjectRepository.findById(id).map(subject -> {
            subject.setName(updated.getName());
            subject.setCode(updated.getCode());
            if (updated.getSemester() != null && updated.getSemester().getId() != null) {
                subject.setSemester(semesterRepository.findById(updated.getSemester().getId()).orElse(null));
            }
            return subjectRepository.save(subject);
        }).orElseThrow(() -> new RuntimeException("Subject not found"));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        subjectRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // --- Users (Students / Teachers) ---
    @GetMapping("/users")
    public List<User> getUsersByRole(@RequestParam(required = false) Role role) {
        List<User> users = userRepository.findAll();
        if (role != null) {
            return users.stream().filter(u -> u.getRole() == role).collect(Collectors.toList());
        }
        return users;
    }

    @PostMapping("/teachers")
    public ResponseEntity<?> createTeacher(@RequestBody Map<String, String> payload) {
        try {
            String name = payload.get("name");
            String email = payload.get("email");
            String password = payload.get("password");

            if (name == null || name.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required."));
            }

            if (userRepository.findByEmail(email.trim()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is already registered."));
            }

            if (!passwordPattern.matcher(password).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters long, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character (@#$%^&+=!)."));
            }

            User teacher = new User();
            teacher.setName(name.trim());
            teacher.setEmail(email.trim());
            teacher.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
            teacher.setRole(Role.TEACHER);

            User saved = userRepository.save(teacher);
            return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "role", saved.getRole(),
                "message", "Teacher account created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
