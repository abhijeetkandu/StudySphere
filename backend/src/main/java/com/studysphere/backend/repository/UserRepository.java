package com.studysphere.backend.repository;

import com.studysphere.backend.entity.Role;
import com.studysphere.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    java.util.List<User> findByRole(Role role);
    Long countByRoleAndCourseIdAndSemesterId(Role role, Long courseId, Long semesterId);
}
